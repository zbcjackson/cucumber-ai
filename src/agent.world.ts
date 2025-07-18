import { StepAgent } from './step-agent';
import { Driver } from './drivers/driver';
import type { IWorldOptions } from '@cucumber/cucumber/lib/support_code_library_builder/world';
import { World } from '@cucumber/cucumber';

export interface Options {
  headless?: boolean;
  logging?: boolean;
  disableCache?: boolean;
}

export class AgentWorld extends World<Options> {
  private readonly stepAgent: StepAgent;

  constructor(options: IWorldOptions<Options>) {
    super(options);
    this.stepAgent = new StepAgent({headless: this.parameters.headless, logging: this.parameters.logging, useCache: !this.parameters.disableCache });
  }

  get agent(): StepAgent {
    return this.stepAgent;
  }

  get driver(): Driver {
    return this.stepAgent.getDriver();
  }

  async quit() {
    await this.stepAgent.stop();
    await this.driver.quit();
  }
}