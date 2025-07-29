import { ActionAgent } from "./action-agent";
import { BrowserAgent } from "./browser-agent";
import { Context } from "./context";
import { DataAgent } from "./data-agent";
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
  private readonly context: Context;
  private started = false;

  constructor(context: Context) {
    this.context = context;
    this.textAgent = new TextAgent(context);
    this.uiAgent = new UIAgent(context);
    this.dataAgent = new DataAgent(context);
    this.browserAgent = new BrowserAgent(context);
    this.actionAgent = new ActionAgent(context);
    this.stepAgent = new StepAgent(context);
  }

  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    await this.textAgent.start();
    await this.uiAgent.start();
    await this.dataAgent.start();
    await this.browserAgent.start();
    await this.actionAgent.start();
    await this.stepAgent.start();

    this.started = true;
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    await this.stepAgent.stop();
    await this.actionAgent.stop();
    await this.browserAgent.stop();
    await this.dataAgent.stop();
    await this.uiAgent.stop();
    await this.textAgent.stop();

    this.started = false;
  }

  getActionAgent(): ActionAgent {
    return this.actionAgent;
  }

  getBrowserAgent(): BrowserAgent {
    return this.browserAgent;
  }

  getDataAgent(): DataAgent {
    return this.dataAgent;
  }

  getStepAgent(): StepAgent {
    return this.stepAgent;
  }

  getTextAgent(): TextAgent {
    return this.textAgent;
  }

  getUIAgent(): UIAgent {
    return this.uiAgent;
  }
}
