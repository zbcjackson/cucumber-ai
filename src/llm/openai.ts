import OpenAI from "openai";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions/completions";
import { ChatCompletionContentPartText } from "openai/src/resources/chat/completions/completions";
import { Cache } from "../cache";
import { parseJson } from "../utils/json";

interface Result {
  success: boolean;
  error?: string;
  result?: Record<string, string>;
}

export class LLM {
  private client: OpenAI;
  private cache: Cache;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
      baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
      defaultHeaders: {
        "HTTP-Referrer": "https://github.com/zbcjackson/cucumber-ai",
        "X-Title": "cucumber-ai",
      },
    });
    this.cache = new Cache();
  }

  async ask(
    messages: Array<ChatCompletionMessageParam>,
    tools: Array<ChatCompletionTool> = [],
  ): Promise<ChatCompletionMessage> {
    console.log("Request: ", JSON.stringify(messages, null, 2));
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: process.env.LLM_MODEL_NAME,
      messages,
      tools,
      temperature: 0,
    });
    console.log(`Response(${(Date.now() - start) / 1000}s): `, response.choices[0].message);

    return response.choices[0].message;
  }

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

      let message = await this.ask(messages, tools);
      messages.push(message);

      while (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          const result = await callTool(toolCall);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
        }

        message = await this.ask(messages, tools);
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
        await callTool(toolCall);
      }
      return true;
    }
    return false;
  }
}
