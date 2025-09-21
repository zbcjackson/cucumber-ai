import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions/completions";
import { ChatCompletionContentPartText } from "openai/src/resources/chat/completions/completions";
import { Cache } from "../cache";
import { parseJson } from "../utils/json";
import { LLM } from "./openai";

export interface Result {
  success: boolean;
  error?: string;
  result?: Record<string, string>;
}

export class ToolExecutor {
  constructor(
    private llm: LLM,
    private cache: Cache,
  ) {}

  async execute(
    prompt: string,
    options: {
      callTool: (toolCall: ChatCompletionMessageToolCall) => Promise<string | ChatCompletionContentPartText[]>;
      tools: ChatCompletionTool[];
      systemPrompt?: string;
      useCache?: boolean;
      cacheKey?: string;
    },
  ): Promise<Result> {
    return await this.printElapsedTime(async () => {
      const { useCache = false, systemPrompt = "", cacheKey = "llm", tools = [], callTool } = options;

      if (useCache && (await this.executeCachedToolCalls(prompt, callTool, cacheKey))) {
        return { success: true };
      }

      const messages: Array<ChatCompletionMessageParam> = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ];

      let message = await this.llm.ask(messages, tools);
      messages.push(message);

      while (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          try {
            const result = await callTool(toolCall);

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Error executing tool "${toolCall.function.name}": ${errorMessage}`,
            });
          }
        }

        message = await this.llm.ask(messages, tools);
        messages.push(message);
      }

      const result: Result = parseJson(message.content);
      if (!result.success) {
        throw new Error(`Action failed: ${prompt}`);
      }

      if (result.success && result.result === undefined) {
        const toolCalls = messages
          .filter((m) => m.role === "assistant" && m.tool_calls && m.tool_calls.length > 0)
          .flatMap((m: ChatCompletionMessage) => m.tool_calls);
        this.cache.writeCache(cacheKey, prompt, toolCalls);
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

  private async executeCachedToolCalls(
    prompt: string,
    callTool: (toolCall: ChatCompletionMessageToolCall) => Promise<string | ChatCompletionContentPartText[]>,
    cacheKey: string,
  ) {
    const cachedToolCalls = this.cache.readCache(cacheKey, prompt) || [];
    if (cachedToolCalls.length > 0) {
      for (const toolCall of cachedToolCalls) {
        try {
          await callTool(toolCall);
        } catch (error) {
          // If cached tool call fails, we should not use cache and fall back to normal execution
          console.warn(`Cached tool call failed for ${toolCall.function.name}: ${error instanceof Error ? error.message : String(error)}`);
          return false;
        }
      }
      return true;
    }
    return false;
  }
}
