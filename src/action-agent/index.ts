import { Agent } from "../agent";
import { Context } from "../context";
import { Action } from "../loaders/action-parser";

export { ConceptAgent } from "./concept-agent";

export class ActionAgent implements Agent {
  private actionContext: Record<string, string>;

  constructor(private context: Context) {
    this.actionContext = {};
  }

  async start() {}

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

      const { success, result, error } = await this.context.getActions().execute(action.name, text, arg);
      if (success) {
        if (result) {
          this.updateContext(result);
        }
      } else {
        throw new Error(`${action.name} action failed: ${error}`);
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
}
