import fs from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { CallToolResult, CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { path as rootPath } from "app-root-path";
import { ChatCompletionMessageToolCall, ChatCompletionTool } from "openai/resources/chat/completions/completions";
import { ChatCompletionContentPartText } from "openai/src/resources/chat/completions/completions";
import { Agent } from "../agent";
import { Context } from "../context";
import { LLM } from "../llm/openai";

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
  private systemPrompt: string;

  constructor(private context: Context) {
    this.started = false;
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
    const callTool = async (toolCall: ChatCompletionMessageToolCall): Promise<ChatCompletionContentPartText[]> => {
      const result = CallToolResultSchema.parse(
        await this.toolMap[toolCall.function.name].callTool({
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        }),
      );
      return result.content as ChatCompletionContentPartText[];
    };

    return await this.llm.execute(prompt, {
      callTool,
      useCache: opts.useCache ?? this.context.isCacheEnabled(),
      systemPrompt: this.systemPrompt,
      cacheKey: "data-agent",
      tools: this.tools,
    });
  }
}
