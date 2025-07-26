import { TextMatcher } from "../TextMatcher";
import { DataAgent } from "../data-agent";
import { Driver } from "../drivers/driver";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";
import { UIAgent } from "../ui-agent";

interface RunnerOptions {
  useCache?: boolean;
}

export class Runner {
  private definedConcepts: Concept[];
  private uiAgent: UIAgent;
  private dataAgent: DataAgent;
  private context: Record<string, string>;
  private matcher: TextMatcher;

  constructor(
    private driver: Driver,
    options: RunnerOptions = {},
  ) {
    this.uiAgent = new UIAgent(this.driver);
    this.dataAgent = new DataAgent({ useCache: options.useCache });
    this.matcher = new TextMatcher({ useCache: options.useCache });
    this.context = {};
  }

  async start() {
    this.definedConcepts = loadConcepts();
    this.uiAgent.start();
    await this.dataAgent.start();
  }

  async stop() {
    this.context = {};
    this.uiAgent.stop();
    await this.dataAgent.stop();
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
}
