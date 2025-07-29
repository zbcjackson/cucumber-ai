import { Agents } from "./agents";
import { Driver } from "./drivers/driver";

export interface Options {
  headless?: boolean;
  logging?: boolean;
  disableCache?: boolean;
  useCache?: boolean;
}

export class Context {
  constructor(
    private driver: Driver,
    private agents: Agents,
    private options: Options = {},
  ) {}

  /**
   * Get the Driver instance
   */
  getDriver(): Driver {
    return this.driver;
  }

  /**
   * Get the Agents instance
   */
  getAgents(): Agents {
    return this.agents;
  }

  /**
   * Get all options
   */
  getOptions(): Options {
    return this.options;
  }

  /**
   * Get a specific option value
   */
  getOption<K extends keyof Options>(key: K): Options[K] {
    return this.options[key];
  }

  /**
   * Check if cache is enabled
   */
  isCacheEnabled(): boolean {
    return !this.options.disableCache && this.options.useCache !== false;
  }

  /**
   * Check if headless mode is enabled
   */
  isHeadless(): boolean {
    return this.options.headless === true;
  }

  /**
   * Check if logging is enabled
   */
  isLoggingEnabled(): boolean {
    return this.options.logging === true;
  }

  /**
   * Initialize the context (driver and agents)
   */
  async init(): Promise<void> {
    await this.driver.init({
      headless: this.isHeadless(),
      logging: this.isLoggingEnabled(),
    });
    await this.agents.start();
  }

  /**
   * Clean up the context (agents and driver)
   */
  async quit(): Promise<void> {
    await this.agents.stop();
    await this.driver.quit();
  }
}
