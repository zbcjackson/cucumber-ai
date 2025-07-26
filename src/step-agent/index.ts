import { ChatCompletionMessageParam } from "openai/resources/chat/completions/completions";
import { Cache } from "../cache";
import { DataAgent } from "../data-agent";
import { Driver } from "../drivers/driver";
import { LLM } from "../llm/openai";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";
import { loadSteps } from "../loaders/step-loader";
import { Step } from "../loaders/step-parser";
import { UIAgent } from "../ui-agent";
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { TextMatcher } from "../TextMatcher";
import { parseJson } from "../utils/json";

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
  private driver: Driver;
  private uiAgent: UIAgent;
  private dataAgent: DataAgent;
  private context: Record<string, string>;
  private matcher: TextMatcher;

  constructor(private options: StepAgentOptions = {}) {
    this.driver = new Driver();
    this.uiAgent = new UIAgent(this.driver);
    this.dataAgent = new DataAgent({ useCache: options.useCache });
    this.matcher = new TextMatcher({ useCache: options.useCache });
    this.context = {};
  }

  getDriver(): Driver {
    return this.driver;
  }

  setDriver(driver: Driver) {
    this.driver = driver;
    this.uiAgent.setDriver(driver);
  }

  setUIAgent(uiAgent: UIAgent) {
    this.uiAgent = uiAgent;
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

  private async findMatchedStep(stepText: string) {
    const stepTextList = this.definedSteps.map((s) => s.text);
    const matchedStep = await this.matcher.find(stepTextList, stepText);
    return { step: this.definedSteps.find((s) => s.text === matchedStep.text), args: matchedStep.args };
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
    return text.replace(/\[\[(.*?)]]/g, (_, key) => args[key.trim()] || this.context[key.trim()] || "");
  }

  private async findMatchedBehavior(action: Action) {
    const concept = this.definedConcepts.find((c) => c.name === action.name);
    if (!concept) {
      return null;
    }
    const behaviorTextList = concept.behaviors.map((b) => b.text);
    const matchedBehavior = await this.matcher.find(behaviorTextList, action.text);
    return { behavior: concept.behaviors.find((b) => b.text === matchedBehavior.text), args: matchedBehavior.args };
  }
}
