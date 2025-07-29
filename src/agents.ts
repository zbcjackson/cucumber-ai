import { Agent } from "./agent";
import { ActionAgent } from "./action-agent";
import { BrowserAgent } from "./browser-agent";
import { DataAgent } from "./data-agent";
import { StepAgent } from "./step-agent";
import { TextAgent } from "./text-agent";
import { UIAgent } from "./ui-agent";
import { Driver } from "./drivers/driver";

export interface AgentsOptions {
  useCache?: boolean;
}

export class Agents {
  private actionAgent: ActionAgent;
  private browserAgent: BrowserAgent;
  private dataAgent: DataAgent;
  private stepAgent: StepAgent;
  private textAgent: TextAgent;
  private uiAgent: UIAgent;
  private started = false;

  constructor(
    private driver: Driver,
    private options: AgentsOptions = {},
  ) {
    // Initialize all agents
    this.textAgent = new TextAgent({ useCache: options.useCache });
    this.uiAgent = new UIAgent(this.driver);
    this.dataAgent = new DataAgent({ useCache: options.useCache });
    this.browserAgent = new BrowserAgent(this.driver, { useCache: options.useCache });

    // ActionAgent and StepAgent need access to this Agents instance
    this.actionAgent = new ActionAgent(this, { useCache: options.useCache });
    this.stepAgent = new StepAgent(this, { useCache: options.useCache });
  }

  /**
   * Start all agents in the correct order
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    // Start agents in dependency order
    await this.textAgent.start();
    await this.uiAgent.start();
    await this.dataAgent.start();
    await this.browserAgent.start();
    await this.actionAgent.start();
    await this.stepAgent.start();

    this.started = true;
  }

  /**
   * Stop all agents in reverse order
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    // Stop agents in reverse dependency order
    await this.stepAgent.stop();
    await this.actionAgent.stop();
    await this.browserAgent.stop();
    await this.dataAgent.stop();
    await this.uiAgent.stop();
    await this.textAgent.stop();

    this.started = false;
  }

  /**
   * Get the ActionAgent
   */
  getActionAgent(): ActionAgent {
    return this.actionAgent;
  }

  /**
   * Get the BrowserAgent
   */
  getBrowserAgent(): BrowserAgent {
    return this.browserAgent;
  }

  /**
   * Get the DataAgent
   */
  getDataAgent(): DataAgent {
    return this.dataAgent;
  }

  /**
   * Get the StepAgent
   */
  getStepAgent(): StepAgent {
    return this.stepAgent;
  }

  /**
   * Get the TextAgent
   */
  getTextAgent(): TextAgent {
    return this.textAgent;
  }

  /**
   * Get the UIAgent
   */
  getUIAgent(): UIAgent {
    return this.uiAgent;
  }

  /**
   * Get all agents as an array
   */
  getAllAgents(): Agent[] {
    return [this.textAgent, this.uiAgent, this.dataAgent, this.browserAgent, this.actionAgent, this.stepAgent];
  }

  /**
   * Check if agents are started
   */
  isStarted(): boolean {
    return this.started;
  }
}
