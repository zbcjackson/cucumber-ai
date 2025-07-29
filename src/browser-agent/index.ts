import fs from "node:fs";
import { join } from "node:path";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions/completions";
import { ActionAgent } from "../action-agent";
import { Agent } from "../agent";
import { Agents } from "../agents";
import { Cache } from "../cache";
import { Context } from "../context";
import { DataAgent } from "../data-agent";
import { Driver } from "../drivers/driver";
import { LLM } from "../llm/openai";
import { StepAgent } from "../step-agent";
import { TextAgent } from "../text-agent";
import { UIAgent } from "../ui-agent";
import { parseJson } from "../utils/json";

interface BrowserAgentOptions {
  useCache?: boolean;
}

interface Result {
  success: boolean;
  error?: string;
  result?: Record<string, string>;
}

interface ToolResult {
  action: string;
  details: string;
}

type ToolFunction = (args: Record<string, unknown>) => Promise<ToolResult>;

export class BrowserAgent implements Agent {
  private llm: LLM;
  private started: boolean;
  private cache: Cache;
  private systemPrompt: string;
  private tools: ChatCompletionTool[] = [];
  private toolMap: Record<string, ToolFunction> = {};
  private context: Context;

  constructor(context: Context) {
    this.context = context;
    this.started = false;
    this.cache = new Cache("browser-agent");
    this.llm = new LLM();
  }

  public async start() {
    if (this.started) {
      await this.stop();
    }

    this.systemPrompt = fs.readFileSync(join(__dirname, "system.prompt.md"), "utf-8");

    this.setupTools();
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
      this.started = false;
    }
  }

  public async ask(prompt: string, opts: { useCache?: boolean } = {}): Promise<Result> {
    return await this.printElapsedTime(async () => {
      if (opts.useCache === undefined) {
        opts.useCache = this.context.isCacheEnabled();
      }

      if (opts.useCache && (await this.executeCachedToolCalls(prompt))) {
        return { success: true };
      }

      const messages: Array<ChatCompletionMessageParam> = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ];

      let message = await this.llm.ask(messages, this.tools);
      messages.push(message);

      while (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          const result = await this.toolMap[toolName](args);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }

        message = await this.llm.ask(messages, this.tools);
        messages.push(message);
      }

      const result: Result = parseJson(message.content);
      if (!result.success) {
        throw new Error(`Browser action failed: ${prompt}`);
      }

      if (result.success && result.result === undefined) {
        const toolCalls = messages
          .filter((m) => m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0)
          .flatMap((m: ChatCompletionMessage) => m.tool_calls);
        this.cache.writeCache(prompt, toolCalls);
      }

      return result;
    });
  }

  private async printElapsedTime<T>(func: () => Promise<T>) {
    const start = Date.now();
    const result = await func();
    const elapsed = (Date.now() - start) / 1000;
    console.log(`Browser agent task elapsed time: ${elapsed}s`);
    return result;
  }

  private async executeCachedToolCalls(prompt: string) {
    const cachedToolCalls = this.cache.readCache(prompt) || [];
    if (cachedToolCalls.length > 0) {
      for (const toolCall of cachedToolCalls) {
        const toolName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        await this.toolMap[toolName](args);
      }
      return true;
    }
    return false;
  }
}
