import { World } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber/lib/support_code_library_builder/world";
import { Driver } from "./drivers/driver";
import { StepAgent } from "./step-agent";

export interface Options {
  headless?: boolean;
  logging?: boolean;
  disableCache?: boolean;
}

export class AgentWorld<T = unknown> extends World<T & Options> {
  private readonly stepAgent: StepAgent;

  constructor(options: IWorldOptions<T & Options>) {
    super(options);
    this.stepAgent = new StepAgent({
      headless: this.parameters.headless,
      logging: this.parameters.logging,
      useCache: !this.parameters.disableCache,
    });
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
