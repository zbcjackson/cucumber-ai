import { Agent } from "../agent";
import { Context } from "../context";
import { Action } from "../loaders/action-parser";
import { loadConcepts } from "../loaders/concept-loader";
import { Concept } from "../loaders/concept-parser";
import { ActionProvider } from "./action-provider";
import { Actions } from "./actions";

export class ConceptAgent implements Agent, ActionProvider {
  private definedConcepts: Concept[] = [];

  constructor(private context: Context) {}

  async start() {
    this.definedConcepts = loadConcepts();
    this.registerActions(this.context.getActions());
  }

  async stop() {
    this.unregisterActions(this.context.getActions());
  }

  registerActions(actions: Actions): void {
    for (const concept of this.definedConcepts) {
      actions.register(concept.name, async (text: string, arg: string | undefined) => {
        await this.executeBehavior(concept.name, text, arg);
        return { success: true };
      });
    }
  }

  unregisterActions(actions: Actions): void {
    for (const concept of this.definedConcepts) {
      actions.unregister(concept.name);
    }
  }

  async executeBehavior(conceptName: string, text: string, arg: string | undefined) {
    const concept = this.definedConcepts.find((c) => c.name === conceptName);
    if (!concept) {
      throw new Error(`Unknown concept: ${conceptName}`);
    }

    const behaviorTextList = concept.behaviors.map((b) => b.text);
    const matchedBehavior = await this.context.getTextAgent().find(behaviorTextList, text);

    if (!matchedBehavior) {
      throw new Error(`No matching behavior found for concept ${conceptName} with text: ${text}`);
    }

    const behavior = concept.behaviors.find((b) => b.text === matchedBehavior.text);
    if (!behavior) {
      throw new Error(`Behavior not found for concept ${conceptName}`);
    }

    const actionAgent = this.context.getActionAgent();
    await actionAgent.executeActions(behavior.actions, matchedBehavior.args);
  }
}
