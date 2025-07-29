import { Agent } from "../agent";
import { Context } from "../context";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";

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
        case "browser": {
          const { success, result, error } = await this.context.getBrowserAgent().ask(text);
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`Browser action failed: ${error}`);
          }
          break;
        }
        case "ai": {
          const { success, result, error } = await this.context.getUIAgent().ai(text);
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`AI action failed: ${error}`);
          }
          break;
        }
        case "aiTap": {
          const { success, result, error } = await this.context.getUIAgent().aiTap(text);
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`AI tap action failed: ${error}`);
          }
          break;
        }
        case "aiInput": {
          const { success, result, error } = await this.context.getUIAgent().aiInput(arg, text);
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`AI input action failed: ${error}`);
          }
          break;
        }
        case "aiHover": {
          const { success, result, error } = await this.context.getUIAgent().aiHover(text);
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`AI hover action failed: ${error}`);
          }
          break;
        }
        case "aiWaitFor": {
          const { success, result, error } = await this.context.getUIAgent().aiWaitFor(text, { timeoutMs: 30000 });
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`AI wait for action failed: ${error}`);
          }
          break;
        }
        case "aiKeyboardPress": {
          const { success, result, error } = await this.context.getUIAgent().aiKeyboardPress(text);
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`AI keyboard press action failed: ${error}`);
          }
          break;
        }
        case "aiAssert": {
          const { success, result, error } = await this.context.getUIAgent().aiAssert(text);
          if (success) {
            if (result) {
              this.updateContext(result);
            }
          } else {
            throw new Error(`AI assert action failed: ${error}`);
          }
          break;
        }
        case "data": {
          const { success, result, error } = await this.context.getDataAgent().ask(text);
          if (success) {
            if (result) {
              this.updateContext(result);
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

  private updateContext(result: Record<string, string> | undefined) {
    if (result) {
      this.actionContext = { ...this.actionContext, ...result };
      console.log(`Update context: ${JSON.stringify(this.actionContext)}`);
    }
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
