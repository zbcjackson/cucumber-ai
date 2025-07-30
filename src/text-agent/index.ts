import fs from "node:fs";
import path from "node:path";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions/completions";
import { Agent } from "../agent";
import { Context } from "../context";
import { LLM } from "../llm/openai";
import { parseJson } from "../utils/json";

interface MatchedText {
  text: string;
  args: Record<string, string>;
}

export class TextAgent implements Agent {
  private readonly llm: LLM;
  private systemPrompt: string;

  constructor(private context: Context) {
    this.llm = context.getLLM();
  }

  async start() {
    this.systemPrompt = fs.readFileSync(path.join(__dirname, "system.prompt.md"), "utf-8");
  }

  async stop() {}

  async find(predefinedTextList: string[], text: string) {
    if (this.context.isCacheEnabled()) {
      const cachedResult = this.context.getCache().readCache("step-agent", this.getCacheKey(predefinedTextList, text));
      if (cachedResult) {
        return cachedResult;
      }
    }
    const messages: Array<ChatCompletionMessageParam> = [
      {
        role: "system",
        content: this.systemPrompt,
      },
      {
        role: "user",
        content: `Here is a list of defined text:\n${JSON.stringify(predefinedTextList)}\n\nFind the predefined text that matches the following text: ${text}`,
      },
    ];
    const message = await this.llm.ask(messages);
    const result: MatchedText = parseJson(message.content);
    if (Object.keys(result).length > 0) {
      this.context.getCache().writeCache("step-agent", this.getCacheKey(predefinedTextList, text), result);
    }
    return result;
  }

  private getCacheKey(predefinedTextList: string[], text: string) {
    return `${predefinedTextList.join("\n")}\n${text}`;
  }
}
