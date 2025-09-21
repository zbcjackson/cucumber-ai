import OpenAI from "openai";
import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions/completions";

export class LLM {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
      baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
      defaultHeaders: {
        "HTTP-Referrer": "https://github.com/zbcjackson/cucumber-ai",
        "X-Title": "cucumber-ai",
      },
    });
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
      tools: tools.length > 0 ? tools : undefined,
      temperature: 0,
      // For QWen from Aliyun, the response_format may disable tool_calls. DeepSeek v3 from Aliyun works.
      // This setting may also affect other models, e.g. gpt-4o.
      // response_format: { type: "json_object" },
    });
    console.log(`Response(${(Date.now() - start) / 1000}s): `, response.choices[0].message);

    return response.choices[0].message;
  }
}
