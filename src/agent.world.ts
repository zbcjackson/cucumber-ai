import { World } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber/lib/support_code_library_builder/world";
import { Driver } from "./drivers/driver";
import { Action } from "./loaders/action-parser";
import { Agents } from "./agents";

export interface Options {
  headless?: boolean;
  logging?: boolean;
  disableCache?: boolean;
}

export class AgentWorld<T = unknown> extends World<T & Options> {
  private readonly _agents: Agents;
  private readonly _driver: Driver;

  constructor(options: IWorldOptions<T & Options>) {
    super(options);
    this._driver = new Driver();
    this._agents = new Agents(this.driver, {
      useCache: !this.parameters.disableCache,
    });
  }

  get driver(): Driver {
    return this._driver;
  }

  get agents(): Agents {
    return this._agents;
  }

  async init() {
    await this.driver.init({
      headless: this.parameters.headless,
      logging: this.parameters.logging,
    });
    await this.agents.start();
  }

  async executeStep(stepText: string) {
    await this.agents.getStepAgent().executeStep(stepText);
  }

  async executeActions(actions: Action[], args: Record<string, string> = {}) {
    await this.agents.getActionAgent().executeActions(actions, args);
  }

  async quit() {
    await this.agents.stop();
    await this.driver.quit();
  }
}
