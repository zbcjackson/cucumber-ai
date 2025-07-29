import fs from "node:fs";
import path from "node:path";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions/completions";
import { Agent } from "../agent";
import { Cache } from "../cache";
import { LLM } from "../llm/openai";
import { parseJson } from "../utils/json";

interface MatchedText {
  text: string;
  args: Record<string, string>;
}

interface TextMatcherOptions {
  useCache?: boolean;
}

export class TextAgent implements Agent {
  private readonly llm: LLM;
  private readonly cache: Cache;
  private systemPrompt: string;

  constructor(private options: TextMatcherOptions = {}) {
    this.llm = new LLM();
    this.cache = new Cache("step-agent");
  }

  async start() {
    this.systemPrompt = fs.readFileSync(path.join(__dirname, "system.prompt.md"), "utf-8");
  }

  async stop() {}

  async find(predefinedTextList: string[], text: string) {
    if (this.options.useCache) {
      const cachedResult = this.cache.readCache(this.getCacheKey(predefinedTextList, text));
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
      this.cache.writeCache(this.getCacheKey(predefinedTextList, text), result);
    }
    return result;
  }

  private getCacheKey(predefinedTextList: string[], text: string) {
    return `${predefinedTextList.join("\n")}\n${text}`;
  }
}
