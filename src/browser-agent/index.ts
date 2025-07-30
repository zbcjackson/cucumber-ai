import fs from "node:fs";
import { join } from "node:path";
import { ChatCompletionMessageToolCall, ChatCompletionTool } from "openai/resources/chat/completions/completions";
import { ActionProvider } from "../action-agent/action-provider";
import { Actions } from "../action-agent/actions";
import { Agent } from "../agent";
import { Context } from "../context";
import { LLM } from "../llm/openai";

interface ToolResult {
  action: string;
  details: string;
}

type ToolFunction = (args: Record<string, unknown>) => Promise<ToolResult>;

export class BrowserAgent implements Agent, ActionProvider {
  private llm: LLM;
  private started: boolean;
  private systemPrompt: string;
  private tools: ChatCompletionTool[] = [];
  private toolMap: Record<string, ToolFunction> = {};
  private context: Context;

  constructor(context: Context) {
    this.context = context;
    this.started = false;
    this.llm = context.getLLM();
  }

  public async start() {
    if (this.started) {
      await this.stop();
    }

    this.systemPrompt = fs.readFileSync(join(__dirname, "system.prompt.md"), "utf-8");

    this.setupTools();
    this.registerActions(this.context.getActions());
    this.started = true;
  }

  private setupTools() {
    const toolDefinitions = [
      {
        name: "open",
        description: "Open the specified URL",
        parameters: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to open",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "saveScreenshot",
        description: "Save a screenshot of the current page",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Screenshot filename (without extension)",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "saveVideo",
        description: "Save the recorded video",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Video filename (without extension)",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "deleteVideo",
        description: "Delete the recorded video",
        parameters: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "addItemInLocalStorage",
        description: "Add an item to local storage",
        parameters: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description: "Storage key",
            },
            value: {
              type: "string",
              description: "Storage value",
            },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "quit",
        description: "Close the browser",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    ];

    this.toolMap = {
      open: async (args: Record<string, unknown>) => {
        const url = args.url as string;
        await this.context.getDriver().open(url);
        return { action: "open", details: `Successfully opened URL: ${url}` };
      },
      saveScreenshot: async (args: Record<string, unknown>) => {
        const name = args.name as string;
        await this.context.getDriver().saveScreenshot(name);
        return { action: "saveScreenshot", details: `Screenshot saved as: ${name}.png` };
      },
      saveVideo: async (args: Record<string, unknown>) => {
        const name = args.name as string;
        await this.context.getDriver().saveVideo(name);
        return { action: "saveVideo", details: `Video saved as: ${name}.webm` };
      },
      deleteVideo: async () => {
        await this.context.getDriver().deleteVideo();
        return { action: "deleteVideo", details: "Video deleted" };
      },
      addItemInLocalStorage: async (args: Record<string, unknown>) => {
        const key = args.key as string;
        const value = args.value as string;
        await this.context.getDriver().addItemInLocalStorage(key, value);
        return { action: "addItemInLocalStorage", details: `Added local storage item: ${key} = ${value}` };
      },
      quit: async () => {
        await this.context.getDriver().quit();
        return { action: "quit", details: "Browser closed" };
      },
    };

    this.tools = toolDefinitions.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  public async stop() {
    if (this.started) {
      try {
        await this.context.getDriver().quit();
      } catch (error) {
        console.warn("Error closing browser:", error);
      }
      this.unregisterActions(this.context.getActions());
      this.started = false;
    }
  }

  public async ask(prompt: string, opts: { useCache?: boolean } = {}) {
    const callTool = async (toolCall: ChatCompletionMessageToolCall): Promise<string> => {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      return JSON.stringify(await this.toolMap[toolName](args));
    };

    return await this.llm.execute(prompt, {
      callTool,
      useCache: opts.useCache ?? this.context.isCacheEnabled(),
      systemPrompt: this.systemPrompt,
      cacheKey: "browser-agent",
      tools: this.tools,
    });
  }

  public registerActions(actions: Actions): void {
    actions.register("browser", async (text) => await this.ask(text));
  }

  public unregisterActions(actions: Actions): void {
    actions.unregister("browser");
  }
}
