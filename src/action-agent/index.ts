import { Agent } from "../agent";
import { BrowserAgent } from "../browser-agent";
import { DataAgent } from "../data-agent";
import { Driver } from "../drivers/driver";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";
import { TextAgent } from "../text-agent";
import { UIAgent } from "../ui-agent";

interface ActionAgentOptions {
  useCache?: boolean;
}

export class ActionAgent implements Agent {
  private definedConcepts: Concept[];
  private uiAgent: UIAgent;
  private dataAgent: DataAgent;
  private context: Record<string, string>;
  private textAgent: TextAgent;
  private browserAgent: BrowserAgent;

  constructor(
    private driver: Driver,
    options: ActionAgentOptions = {},
  ) {
    this.uiAgent = new UIAgent(this.driver);
    this.dataAgent = new DataAgent({ useCache: options.useCache });
    this.textAgent = new TextAgent({ useCache: options.useCache });
    this.browserAgent = new BrowserAgent(this.driver, { useCache: options.useCache });
    this.context = {};
  }

  async start() {
    this.definedConcepts = loadConcepts();
    await this.textAgent.start();
    await this.uiAgent.start();
    await this.dataAgent.start();
    await this.browserAgent.start();
  }

  async stop() {
    this.context = {};
    await this.uiAgent.stop();
    await this.dataAgent.stop();
    await this.browserAgent.stop();
  }

  async executeActions(actions: Action[], args: Record<string, string> = {}) {
    for (const action of actions) {
      const text = this.replaceArgValue(action.text, args);
      const arg = action.arg && this.replaceArgValue(action.arg, args);
      console.log(
        `Executing action: ${action.name} with text: ${text}, arg: ${arg}, context: ${JSON.stringify(this.context)}`,
      );
      switch (action.name) {
        case "browser":
          await this.browserAgent.ask(text);
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
    const matchedBehavior = await this.textAgent.find(behaviorTextList, action.text);
    return { behavior: concept.behaviors.find((b) => b.text === matchedBehavior.text), args: matchedBehavior.args };
  }

  setUIAgent(uiAgent: UIAgent) {
    this.uiAgent = uiAgent;
  }

  setDataAgent(dataAgent: DataAgent) {
    this.dataAgent = dataAgent;
  }
}
