import { ActionAgent } from "./action-agent";
import { Agent } from "./agent";
import { BrowserAgent } from "./browser-agent";
import { Context } from "./context";
import { DataAgent } from "./data-agent";
import { Driver } from "./drivers/driver";
import { StepAgent } from "./step-agent";
import { TextAgent } from "./text-agent";
import { UIAgent } from "./ui-agent";

export class Agents {
  private readonly actionAgent: ActionAgent;
  private readonly browserAgent: BrowserAgent;
  private readonly dataAgent: DataAgent;
  private readonly stepAgent: StepAgent;
  private readonly textAgent: TextAgent;
  private readonly uiAgent: UIAgent;
  private started = false;

  constructor(context: Context) {
    this.textAgent = new TextAgent(context);
    this.uiAgent = new UIAgent(context);
    this.dataAgent = new DataAgent(context);
    this.browserAgent = new BrowserAgent(context);
    this.actionAgent = new ActionAgent(context);
    this.stepAgent = new StepAgent(context);
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
