import { TextMatcher } from "../TextMatcher";
import { loadSteps } from "../loaders/step-loader";
import { Step } from "../loaders/step-parser";
import { Runner } from "../runner";

interface StepAgentOptions {
  useCache?: boolean;
}

export class StepAgent {
  private definedSteps: Step[];
  private matcher: TextMatcher;

  constructor(
    private runner: Runner,
    options: StepAgentOptions = {},
  ) {
    this.matcher = new TextMatcher({ useCache: options.useCache });
  }

  async start() {
    this.definedSteps = loadSteps();
  }

  async stop() {}

  async executeStep(stepText: string) {
    const match = await this.findMatchedStep(stepText);
    if (!match.step) {
      throw new Error(`Step not found: ${stepText}`);
    }

    await this.runner.executeActions(match.step.actions, match.args);
  }

  private async findMatchedStep(stepText: string) {
    const stepTextList = this.definedSteps.map((s) => s.text);
    const matchedStep = await this.matcher.find(stepTextList, stepText);
    return { step: this.definedSteps.find((s) => s.text === matchedStep.text), args: matchedStep.args };
  }
}
