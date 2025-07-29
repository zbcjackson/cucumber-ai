import { Agent } from "../agent";
import { loadSteps } from "../loaders/step-loader";
import { Step } from "../loaders/step-parser";
import { ActionAgent } from "../action-agent";
import { TextAgent } from "../text-agent";

interface StepAgentOptions {
  useCache?: boolean;
}

export class StepAgent implements Agent {
  private definedSteps: Step[];
  private textAgent: TextAgent;

  constructor(
    private actionAgent: ActionAgent,
    options: StepAgentOptions = {},
  ) {
    this.textAgent = new TextAgent({ useCache: options.useCache });
  }

  async start() {
    this.definedSteps = loadSteps();
    await this.textAgent.start();
  }

  async stop() {
    await this.textAgent.stop();
  }

  async executeStep(stepText: string) {
    const match = await this.findMatchedStep(stepText);
    if (!match.step) {
      throw new Error(`Step not found: ${stepText}`);
    }

    await this.actionAgent.executeActions(match.step.actions, match.args);
  }

  private async findMatchedStep(stepText: string) {
    const stepTextList = this.definedSteps.map((s) => s.text);
    const matchedStep = await this.textAgent.find(stepTextList, stepText);
    return { step: this.definedSteps.find((s) => s.text === matchedStep.text), args: matchedStep.args };
  }
}
