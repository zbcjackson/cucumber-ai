import { ChatCompletionMessageParam } from "openai/resources/chat/completions/completions";
import { Cache } from "../cache";
import { DataAgent } from "../data-agent";
import { Driver } from "../drivers/driver";
import { LLM } from "../llm/openai";
import { Action } from "../step-loader/action-parser";
import { loadConcepts } from "../step-loader/concept-loader";
import { Concept } from "../step-loader/concept-parser";
import { loadSteps } from "../step-loader/step-loader";
import { Step } from "../step-loader/step-parser";
import { UIAgent } from "../ui-agent";
import "dotenv/config";

interface MatchedText {
  text: string;
  args: Record<string, string>;
}

interface StepAgentOptions {
  headless?: boolean;
  logging?: boolean;
  useCache?: boolean;
}

export class StepAgent {
  private definedSteps: Step[];
  private definedConcepts: Concept[];
  private readonly llm: LLM;
  private readonly cache: Cache;
  private driver: Driver;
  private uiAgent: UIAgent;
  private dataAgent: DataAgent;
  private context: Record<string, string>;

  constructor(private options: StepAgentOptions = {}) {
    this.driver = new Driver();
    this.uiAgent = new UIAgent(this.driver);
    this.dataAgent = new DataAgent({ useCache: options.useCache });
    this.llm = new LLM();
    this.context = {};
    this.cache = new Cache("step-agent");
  }

  getDriver(): Driver {
    return this.driver;
  }

  setDriver(driver: Driver) {
    this.driver = driver;
    this.uiAgent.setDriver(driver);
  }

  getUIAgent(): UIAgent {
    return this.uiAgent;
  }

  setUIAgent(uiAgent: UIAgent) {
    this.uiAgent = uiAgent;
  }

  getDataAgent(): DataAgent {
    return this.dataAgent;
  }

  setDataAgent(dataAgent: DataAgent) {
    this.dataAgent = dataAgent;
  }

  async start() {
    this.definedSteps = loadSteps();
    this.definedConcepts = loadConcepts();
    await this.dataAgent.start();
    await this.driver.init({
      headless: this.options.headless,
      logging: this.options.logging,
    });
    this.uiAgent.start();
  }

  async stop() {
    this.context = {};
    await this.dataAgent.stop();
  }

  async executeStep(stepText: string) {
    const match = await this.findMatchedStep(stepText);
    if (!match.step) {
      throw new Error(`Step not found: ${stepText}`);
    }

    await this.executeActions(match.step.actions, match.args);
  }

  async executeActions(actions: Action[], args: Record<string, string> = {}) {
    for (const action of actions) {
      const text = this.replaceArgValue(action.text, args);
      const arg = action.arg && this.replaceArgValue(action.arg, args);
      console.log(
        `Executing action: ${action.name} with text: ${text}, arg: ${arg}, context: ${JSON.stringify(this.context)}`,
      );
      switch (action.name) {
        case "open":
          await this.driver.open(text);
          break;
        case "ai":
          await this.uiAgent.ai(text);
          break;
        case "aiTap":
          await this.uiAgent.aiTap(text);
          break;
        case "aiInput":
          await this.uiAgent.aiInput(arg, text);
          break;
        case "aiHover":
          await this.uiAgent.aiHover(text);
          break;
        case "aiWaitFor":
          await this.uiAgent.aiWaitFor(text, { timeoutMs: 30000 });
          break;
        case "aiKeyboardPress":
          await this.uiAgent.aiKeyboardPress(text);
          break;
        case "aiAssert":
          await this.uiAgent.aiAssert(text);
          break;
        case "data": {
          const { success, result, error } = await this.dataAgent.ask(text);
          if (success) {
            if (result) {
              this.context = { ...this.context, ...result };
              console.log(`Update context: ${JSON.stringify(this.context)}`);
            }
          } else {
            throw new Error(`Data action failed: ${error}`);
          }
          break;
        }
        default: {
          const matchedBehavior = await this.findMatchedBehavior({ ...action, text });
          if (!matchedBehavior || !matchedBehavior.behavior) {
            throw new Error(`Unknown action: ${action.name}: ${text}`);
          }
          await this.executeActions(matchedBehavior.behavior.actions, matchedBehavior.args);
        }
      }
    }
  }

  private replaceArgValue(text: string, args: Record<string, string> = {}): string {
    return text.replace(/\[\[(.*?)\]\]/g, (_, key) => args[key.trim()] || this.context[key.trim()] || "");
  }

  private async findMatchedStep(stepText: string) {
    const stepTextList = this.definedSteps.map((s) => s.text);
    const matchedStep = await this.findMatchedText(stepTextList, stepText);
    return { step: this.definedSteps.find((s) => s.text === matchedStep.text), args: matchedStep.args };
  }

  private async findMatchedBehavior(action: Action) {
    const concept = this.definedConcepts.find((c) => c.name === action.name);
    if (!concept) {
      return null;
    }
    const behaviorTextList = concept.behaviors.map((b) => b.text);
    const matchedBehavior = await this.findMatchedText(behaviorTextList, action.text);
    return { behavior: concept.behaviors.find((b) => b.text === matchedBehavior.text), args: matchedBehavior.args };
  }

  private async findMatchedText(predefinedTextList: string[], text: string) {
    if (this.options.useCache) {
      const cachedResult = this.cache.readCache(this.getCacheKey(predefinedTextList, text));
      if (cachedResult) {
        return cachedResult;
      }
    }
    const messages: Array<ChatCompletionMessageParam> = [
      {
        role: "system",
        content:
          "You are a helpful assistant who can find matched text in a list. The user will provide a list of predefined which is in JSON format. The provided text does NOT have to be exact same with the text in the list of predefined text, the text has same meaning is also matched.\n You should always respond in a exact JSON format only. DO NOT respond in a code block format (e.g. surrounded with triple backticks).\n There are only 2 fields allowed:\n* text: A string. It's the exact text in the list that matches the provided text.\n* args: An object. The keys are the trimmed text inside double curly braces '{{}}' in the value of the text field. The value of each key is the text you found in the provided text which can match the key. \nFor example,  \n If no match is found, return {}.",
      },
      {
        role: "user",
        content: `Here is a list of defined text:\n${JSON.stringify(predefinedTextList)}\n\nFind the predefined text that matches the following text: ${text}`,
      },
    ];
    const message = await this.llm.ask(messages);
    const jsonMatch = message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No JSON string found in message.content: ${message.content}`);
    }
    const result = JSON.parse(jsonMatch[0]);
    if (jsonMatch[0].trim() !== "{}") {
      this.cache.writeCache(this.getCacheKey(predefinedTextList, text), result);
    }
    return result;
  }

  private getCacheKey(predefinedTextList: string[], text: string) {
    return `${predefinedTextList.join("\n")}\n${text}`;
  }
}
