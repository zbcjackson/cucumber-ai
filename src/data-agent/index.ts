import fs from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResult, CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { path as rootPath } from "app-root-path";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions/completions";
import { ChatCompletionContentPartText } from "openai/src/resources/chat/completions/completions";
import { Agent } from "../agent";
import { Cache } from "../cache";
import { LLM } from "../llm/openai";
import { parseJson } from "../utils/json";

interface Config {
  mcpServer: Record<
    string,
    {
      type: "sse" | "stdio";
      url?: string; // Only for SSE
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    }
  >;
}

export async function db(prompt: string) {
  const agent = new DataAgent();
  await agent.start();
  try {
    return await agent.ask(prompt);
  } finally {
    await agent.stop();
  }
}

interface DatabaseAgentOptions {
  useCache?: boolean;
}

interface Result {
  success: boolean;
  error?: string;
  result?: Record<string, string>;
}

export class DataAgent implements Agent {
  private config: Config;
  private clients: Client[] = [];
  private tools: ChatCompletionTool[] = [];
  private toolMap: Record<string, Client> = {};
  private llm: LLM;
  private started: boolean;
  private cache: Cache;
  private systemPrompt: string;

  constructor(private options: DatabaseAgentOptions = {}) {
    this.started = false;
    this.cache = new Cache("data-agent");
    const configPath = join(rootPath, "config.json");
    if (fs.existsSync(configPath)) {
      this.config = require(configPath) as Config;
    } else {
      this.config = { mcpServer: {} };
    }
    this.llm = new LLM();
  }

  public async start() {
    if (this.started) {
      await this.stop();
    }
    this.systemPrompt = fs.readFileSync(join(__dirname, "system.prompt.md"), "utf-8");
    await this.startServers();
    await this.collectTools();
    this.started = true;
  }

  private async collectTools() {
    for (const client of this.clients) {
      const mcpToolList = await client.listTools();
      for (const tool of mcpToolList.tools) {
        this.toolMap[tool.name] = client;
        this.tools.push({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        });
      }
    }
  }

  private async startServers() {
    for (const mcpName in this.config.mcpServer) {
      const client = new Client({
        name: `mcp-client-${mcpName}`,
        version: "0.1.0",
      });
      const mcpServer = this.config.mcpServer[mcpName];
      const clientTransport =
        mcpServer.type === "sse"
          ? new SSEClientTransport(new URL(mcpServer.url))
          : new StdioClientTransport({
              command: mcpServer.command,
              args: mcpServer.args,
              env: {
                ...(process.env as Record<string, string>),
                ...mcpServer.env,
              },
            });
      await client.connect(clientTransport);
      this.clients.push(client);
    }
  }

  public async stop() {
    for (const client of this.clients) {
      await client.close();
    }
    this.clients = [];
    this.tools = [];
    this.toolMap = {};
    this.started = false;
  }

  public async ask(prompt: string, opts: { useCache?: boolean } = {}): Promise<Result> {
    return await this.printElapsedTime(async () => {
      if (opts.useCache === undefined) {
        opts.useCache = this.options.useCache;
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
          const result: CallToolResult = CallToolResultSchema.parse(
            await this.toolMap[toolCall.function.name].callTool({
              name: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments),
            }),
          );

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result.content as ChatCompletionContentPartText[],
          });
        }

        message = await this.llm.ask(messages, this.tools);
        messages.push(message);
      }
      const result: Result = parseJson(message.content);
      if (!result.success) {
        throw new Error(`Data action failed: ${prompt}`);
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
    console.log(`Agent task elapsed time: ${elapsed}s`);
    return result;
  }

  private async executeCachedToolCalls(prompt: string) {
    const cachedToolCalls = this.cache.readCache(prompt) || [];
    if (cachedToolCalls.length > 0) {
      for (const toolCall of cachedToolCalls) {
        await this.toolMap[toolCall.function.name].callTool({
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });
      }
      return true;
    }
    return false;
  }
}
