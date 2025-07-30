import { ActionAgent, ConceptAgent } from "./action-agent";
import { Actions } from "./action-agent/actions";
import { Agents } from "./agents";
import { BrowserAgent } from "./browser-agent";
import { Cache } from "./cache";
import { DataAgent } from "./data-agent";
import { Driver } from "./drivers/driver";
import { LLM } from "./llm/openai";
import { ToolExecutor } from "./llm/tool-executor";
import { StepAgent } from "./step-agent";
import { TextAgent } from "./text-agent";
import { UIAgent } from "./ui-agent";

export interface Options {
  headless?: boolean;
  logging?: boolean;
  disableCache?: boolean;
}

export class Context {
  private readonly driver: Driver;
  private readonly agents: Agents;
  private readonly actions: Actions;
  private readonly cache: Cache;
  private readonly llm: LLM;
  private readonly toolExecutor: ToolExecutor;

  constructor(private options: Options = {}) {
    this.driver = new Driver();
    this.actions = new Actions();
    this.cache = new Cache();
    this.llm = new LLM();
    this.toolExecutor = new ToolExecutor(this.llm, this.cache);
    this.agents = new Agents(this);
  }

  getDriver(): Driver {
    return this.driver;
  }

  getActionAgent(): ActionAgent {
    return this.agents.getActionAgent();
  }

  getBrowserAgent(): BrowserAgent {
    return this.agents.getBrowserAgent();
  }

  getConceptAgent(): ConceptAgent {
    return this.agents.getConceptAgent();
  }

  getDataAgent(): DataAgent {
    return this.agents.getDataAgent();
  }

  getStepAgent(): StepAgent {
    return this.agents.getStepAgent();
  }

  getTextAgent(): TextAgent {
    return this.agents.getTextAgent();
  }

  getUIAgent(): UIAgent {
    return this.agents.getUIAgent();
  }

  getLLM(): LLM {
    return this.llm;
  }

  getToolExecutor(): ToolExecutor {
    return this.toolExecutor;
  }

  getActions(): Actions {
    return this.actions;
  }

  getCache(): Cache {
    return this.cache;
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
    return !this.options.disableCache;
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
