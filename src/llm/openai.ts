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
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
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
      model: "openai/gpt-4o",
      messages,
      tools,
      temperature: 0,
    });
    console.log(`Response(${(Date.now() - start) / 1000}s): `, response.choices[0].message);

    return response.choices[0].message;
  }
}
