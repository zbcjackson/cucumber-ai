import { World } from "@cucumber/cucumber";
import type { IWorldOptions } from "@cucumber/cucumber/lib/support_code_library_builder/world";
import { Agents } from "./agents";
import { Context } from "./context";
import { Driver } from "./drivers/driver";
import { Action } from "./loaders/action-parser";

export interface Options {
  headless?: boolean;
  logging?: boolean;
  disableCache?: boolean;
}

export class AgentWorld<T = unknown> extends World<T & Options> {
  private readonly _context: Context;

  constructor(options: IWorldOptions<T & Options>) {
    super(options);
    this._context = new Context({
      headless: this.parameters.headless,
      logging: this.parameters.logging,
      disableCache: this.parameters.disableCache,
    });
  }

  get driver(): Driver {
    return this._context.getDriver();
  }

  get context(): Context {
    return this._context;
  }

  async init() {
    await this.context.init();
  }

  async executeStep(stepText: string) {
    await this.context.getStepAgent().executeStep(stepText);
  }

  async executeActions(actions: Action[], args: Record<string, string> = {}) {
    await this.context.getActionAgent().executeActions(actions, args);
  }

  async quit() {
    await this.context.quit();
  }
}
