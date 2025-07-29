import { Agent } from "../agent";
import { Context } from "../context";
import { loadSteps } from "../loaders/step-loader";
import { Step } from "../loaders/step-parser";

interface StepAgentOptions {
  useCache?: boolean;
}

export class StepAgent implements Agent {
  private definedSteps: Step[];

  constructor(private context: Context) {}

  async start() {
    this.definedSteps = loadSteps();
  }

  async stop() {}

  async executeStep(stepText: string) {
    const match = await this.findMatchedStep(stepText);
    if (!match.step) {
      throw new Error(`Step not found: ${stepText}`);
    }

    await this.context.getAgents().getActionAgent().executeActions(match.step.actions, match.args);
  }

  private async findMatchedStep(stepText: string) {
    const stepTextList = this.definedSteps.map((s) => s.text);
    const matchedStep = await this.context.getAgents().getTextAgent().find(stepTextList, stepText);
    return { step: this.definedSteps.find((s) => s.text === matchedStep.text), args: matchedStep.args };
  }
}
