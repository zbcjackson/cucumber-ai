import { Agent } from "../agent";
import { Agents } from "../agents";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";

interface ActionAgentOptions {
  useCache?: boolean;
}

export class ActionAgent implements Agent {
  private definedConcepts: Concept[];
  private context: Record<string, string>;

  constructor(
    private agents: Agents,
    options: ActionAgentOptions = {},
  ) {
    this.context = {};
  }

  async start() {
    this.definedConcepts = loadConcepts();
  }

  async stop() {
    this.context = {};
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
          await this.agents.getBrowserAgent().ask(text);
          break;
        case "ai":
          await this.agents.getUIAgent().ai(text);
          break;
        case "aiTap":
          await this.agents.getUIAgent().aiTap(text);
          break;
        case "aiInput":
          await this.agents.getUIAgent().aiInput(arg, text);
          break;
        case "aiHover":
          await this.agents.getUIAgent().aiHover(text);
          break;
        case "aiWaitFor":
          await this.agents.getUIAgent().aiWaitFor(text, { timeoutMs: 30000 });
          break;
        case "aiKeyboardPress":
          await this.agents.getUIAgent().aiKeyboardPress(text);
          break;
        case "aiAssert":
          await this.agents.getUIAgent().aiAssert(text);
          break;
        case "data": {
          const { success, result, error } = await this.agents.getDataAgent().ask(text);
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
    const matchedBehavior = await this.agents.getTextAgent().find(behaviorTextList, action.text);
    return { behavior: concept.behaviors.find((b) => b.text === matchedBehavior.text), args: matchedBehavior.args };
  }
}
