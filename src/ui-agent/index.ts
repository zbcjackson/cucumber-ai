import { PlaywrightAgent } from "@midscene/web";
import { ActionAgent } from "../action-agent";
import { Agent } from "../agent";
import { Agents } from "../agents";
import { BrowserAgent } from "../browser-agent";
import { Context } from "../context";
import { DataAgent } from "../data-agent";
import { Driver } from "../drivers/driver";
import { StepAgent } from "../step-agent";
import { TextAgent } from "../text-agent";

export class UIAgent implements Agent {
  private agent: PlaywrightAgent;
  private started = false;

  constructor(private context: Context) {}

  setDriver(driver: Driver) {
    if (this.started) {
      throw new Error("UI Agent has already started, cannot set driver.");
    }
    // This method is kept for backward compatibility but driver is now accessed through context
  }

  async start() {
    this.agent = new PlaywrightAgent(this.context.getDriver().page);
    this.started = true;
  }

  async stop() {
    this.agent = null;
    this.started = false;
  }

  private async agentMethod(method: string, ...args) {
    // await this.agent.waitForNetworkIdle(10000);
    return await this.agent[method](...args);
  }

  async ai(prompt: string, type?: string) {
    await this.agentMethod("ai", prompt, type);
  }

  async aiTap(locatePrompt: string, opt?: LocateOption) {
    await this.agentMethod("aiTap", locatePrompt, opt);
  }

  async aiInput(value: string, locatePrompt: string, opt?: LocateOption) {
    await this.agentMethod("aiInput", value, locatePrompt, opt);
  }

  async aiHover(locatePrompt: string, opt?: LocateOption) {
    await this.agentMethod("aiHover", locatePrompt, opt);
  }

  async aiKeyboardPress(key: string, locatePrompt?: string, opt?: LocateOption) {
    await this.agentMethod("aiKeyboardPress", key, locatePrompt, opt);
  }

  async aiWaitFor(prompt: string, opt?: AgentWaitForOpt) {
    await this.agentMethod("aiWaitFor", prompt, opt);
  }

  async aiAssert(assertion: string, msg?: string, opt?: AgentAssertOpt) {
    await this.agentMethod("aiAssert", assertion, msg, opt);
  }
}

interface LocateOption {
  prompt?: string;
  deepThink?: boolean;
  cacheable?: boolean;
}
interface AgentWaitForOpt {
  checkIntervalMs?: number;
  timeoutMs?: number;
}
interface AgentAssertOpt {
  keepRawResponse?: boolean;
}
