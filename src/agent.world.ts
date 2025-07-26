import { World } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber/lib/support_code_library_builder/world";
import { Driver } from "./drivers/driver";
import { Action } from "./loaders/action-parser";
import { Runner } from "./runner";
import { StepAgent } from "./step-agent";

export interface Options {
  headless?: boolean;
  logging?: boolean;
  disableCache?: boolean;
}

export class AgentWorld<T = unknown> extends World<T & Options> {
  private readonly stepAgent: StepAgent;
  private readonly _runner: Runner;
  private readonly _driver: Driver;

  constructor(options: IWorldOptions<T & Options>) {
    super(options);
    this._driver = new Driver();
    this._runner = new Runner(this.driver);
    this.stepAgent = new StepAgent(this.runner, {
      useCache: !this.parameters.disableCache,
    });
  }

  get driver(): Driver {
    return this._driver;
  }

  get runner(): Runner {
    return this._runner;
  }

  async init() {
    await this.driver.init({
      headless: this.parameters.headless,
      logging: this.parameters.logging,
    });
    await this.runner.start();
    await this.stepAgent.start();
  }

  async executeStep(stepText: string) {
    await this.stepAgent.executeStep(stepText);
  }

  async executeActions(actions: Action[], args: Record<string, string> = {}) {
    await this.runner.executeActions(actions, args);
  }

  async quit() {
    await this.stepAgent.stop();
    await this.runner.stop();
    await this.driver.quit();
  }
}
