import { PlaywrightAgent } from "@midscene/web";
import { ActionProvider } from "../action-agent/action-provider";
import { Actions } from "../action-agent/actions";
import { Agent } from "../agent";
import { Context } from "../context";
import { Result } from "../llm/openai";

export class UIAgent implements Agent, ActionProvider {
  private agent: PlaywrightAgent;
  private started = false;

  constructor(private context: Context) {}

  async start() {
    this.agent = new PlaywrightAgent(this.context.getDriver().page);
    this.started = true;
  }

  async stop() {
    this.agent = null;
    this.started = false;
  }

  private async agentMethod(method: string, ...args): Promise<Result> {
    // await this.agent.waitForNetworkIdle(10000);
    await this.agent[method](...args);
    return { success: true };
  }

  async ai(prompt: string, type?: string) {
    return await this.agentMethod("ai", prompt, type);
  }

  async aiTap(locatePrompt: string, opt?: LocateOption) {
    return await this.agentMethod("aiTap", locatePrompt, opt);
  }

  async aiInput(value: string, locatePrompt: string, opt?: LocateOption) {
    return await this.agentMethod("aiInput", value, locatePrompt, opt);
  }

  async aiHover(locatePrompt: string, opt?: LocateOption) {
    return await this.agentMethod("aiHover", locatePrompt, opt);
  }

  async aiKeyboardPress(key: string, locatePrompt?: string, opt?: LocateOption) {
    return await this.agentMethod("aiKeyboardPress", key, locatePrompt, opt);
  }

  async aiWaitFor(prompt: string, opt?: AgentWaitForOpt) {
    return await this.agentMethod("aiWaitFor", prompt, opt);
  }

  async aiAssert(assertion: string, msg?: string, opt?: AgentAssertOpt) {
    return await this.agentMethod("aiAssert", assertion, msg, opt);
  }

  public registerActions(actions: Actions): void {
    actions.register("ai", async (text) => {
      const result = await this.ai(text);
      return { success: result.success, result: result.result, error: result.error };
    });

    actions.register("aiTap", async (text) => {
      const result = await this.aiTap(text);
      return { success: result.success, result: result.result, error: result.error };
    });

    actions.register("aiInput", async (text, arg) => {
      const result = await this.aiInput(arg || "", text);
      return { success: result.success, result: result.result, error: result.error };
    });

    actions.register("aiHover", async (text) => {
      const result = await this.aiHover(text);
      return { success: result.success, result: result.result, error: result.error };
    });

    actions.register("aiWaitFor", async (text) => {
      const result = await this.aiWaitFor(text, { timeoutMs: 30000 });
      return { success: result.success, result: result.result, error: result.error };
    });

    actions.register("aiKeyboardPress", async (text) => {
      const result = await this.aiKeyboardPress(text);
      return { success: result.success, result: result.result, error: result.error };
    });

    actions.register("aiAssert", async (text) => {
      const result = await this.aiAssert(text);
      return { success: result.success, result: result.result, error: result.error };
    });
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
