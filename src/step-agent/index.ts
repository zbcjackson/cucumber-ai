import { DataAgent } from "../data-agent";
import { Driver } from "../drivers/driver";
import { loadSteps } from "../loaders/step-loader";
import { Step } from "../loaders/step-parser";
import { UIAgent } from "../ui-agent";
import "dotenv/config";
import { TextMatcher } from "../TextMatcher";
import { Runner } from "../runner";

interface StepAgentOptions {
  headless?: boolean;
  logging?: boolean;
  useCache?: boolean;
}

export class StepAgent {
  private definedSteps: Step[];
  private driver: Driver;
  private matcher: TextMatcher;
  private runner: Runner;

  constructor(private options: StepAgentOptions = {}) {
    this.driver = new Driver();
    this.matcher = new TextMatcher({ useCache: options.useCache });
    this.runner = new Runner(this.driver);
  }

  getDriver(): Driver {
    return this.driver;
  }

  setDriver(driver: Driver) {
    this.driver = driver;
    this.runner.setDriver(driver);
  }

  setUIAgent(uiAgent: UIAgent) {
    this.runner.setUIAgent(uiAgent);
  }

  setDataAgent(dataAgent: DataAgent) {
    this.runner.setDataAgent(dataAgent);
  }

  async start() {
    this.definedSteps = loadSteps();
    await this.driver.init({
      headless: this.options.headless,
      logging: this.options.logging,
    });
    await this.runner.start();
  }

  async stop() {
    await this.runner.stop();
  }

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
