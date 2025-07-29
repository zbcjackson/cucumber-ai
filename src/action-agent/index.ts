import { Agent } from "../agent";
import { Context } from "../context";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";

interface ActionAgentOptions {
  useCache?: boolean;
}

export class ActionAgent implements Agent {
  private definedConcepts: Concept[];
  private actionContext: Record<string, string>;

  constructor(private context: Context) {
    this.actionContext = {};
  }

  async start() {
    this.definedConcepts = loadConcepts();
  }

  async stop() {
    this.actionContext = {};
  }

  async executeActions(actions: Action[], args: Record<string, string> = {}) {
    for (const action of actions) {
      const text = this.replaceArgValue(action.text, args);
      const arg = action.arg && this.replaceArgValue(action.arg, args);
      console.log(
        `Executing action: ${action.name} with text: ${text}, arg: ${arg}, context: ${JSON.stringify(this.actionContext)}`,
      );
      switch (action.name) {
        case "browser":
          await this.context.getBrowserAgent().ask(text);
          break;
        case "ai":
          await this.context.getUIAgent().ai(text);
          break;
        case "aiTap":
          await this.context.getUIAgent().aiTap(text);
          break;
        case "aiInput":
          await this.context.getUIAgent().aiInput(arg, text);
          break;
        case "aiHover":
          await this.context.getUIAgent().aiHover(text);
          break;
        case "aiWaitFor":
          await this.context.getUIAgent().aiWaitFor(text, { timeoutMs: 30000 });
          break;
        case "aiKeyboardPress":
          await this.context.getUIAgent().aiKeyboardPress(text);
          break;
        case "aiAssert":
          await this.context.getUIAgent().aiAssert(text);
          break;
        case "data": {
          const { success, result, error } = await this.context.getDataAgent().ask(text);
          if (success) {
            if (result) {
              this.actionContext = { ...this.actionContext, ...result };
              console.log(`Update context: ${JSON.stringify(this.actionContext)}`);
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
    return text.replace(/\[\[(.*?)]]/g, (_, key) => args[key.trim()] || this.actionContext[key.trim()] || "");
  }

  private async findMatchedBehavior(action: Action) {
    const concept = this.definedConcepts.find((c) => c.name === action.name);
    if (!concept) {
      return null;
    }
    const behaviorTextList = concept.behaviors.map((b) => b.text);
    const matchedBehavior = await this.context.getTextAgent().find(behaviorTextList, action.text);
    return { behavior: concept.behaviors.find((b) => b.text === matchedBehavior.text), args: matchedBehavior.args };
  }
}
