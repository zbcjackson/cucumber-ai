import { Agent } from "../agent";
import { Context } from "../context";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";
import { Actions } from "./actions";

export class ActionAgent implements Agent {
  private definedConcepts: Concept[];
  private actionContext: Record<string, string>;
  private actions: Actions;

  constructor(private context: Context) {
    this.actionContext = {};
    this.actions = new Actions(context);
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

      if (this.actions.has(action.name)) {
        const { success, result, error } = await this.actions.execute(action.name, text, arg, this.actionContext);
        if (success) {
          if (result) {
            this.updateContext(result);
          }
        } else {
          throw new Error(`${action.name} action failed: ${error}`);
        }
      } else {
        const matchedBehavior = await this.findMatchedBehavior({ ...action, text });
        if (!matchedBehavior || !matchedBehavior.behavior) {
          throw new Error(`Unknown action: ${action.name}: ${text}`);
        }
        await this.executeActions(matchedBehavior.behavior.actions, matchedBehavior.args);
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
