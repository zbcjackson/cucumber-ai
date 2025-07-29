import { Context } from "../context";

export type ActionHandler = (
  text: string,
  arg: string | undefined,
  context: Record<string, string>,
) => Promise<{ success: boolean; result?: Record<string, string>; error?: string }>;

export class Actions {
  private handlers: Map<string, ActionHandler> = new Map();

  constructor(private context: Context) {
    this.registerDefaultActions();
  }

  register(name: string, handler: ActionHandler): void {
    this.handlers.set(name, handler);
  }

  async execute(
    name: string,
    text: string,
    arg: string | undefined,
    context: Record<string, string>,
  ): Promise<{ success: boolean; result?: Record<string, string>; error?: string }> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return {
        success: false,
        error: `Unknown action: ${name}`,
      };
    }

    try {
      return await handler(text, arg, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }

  private registerDefaultActions(): void {
    // Browser action
    this.register("browser", async (text) => {
      const { success, result, error } = await this.context.getBrowserAgent().ask(text);
      return { success, result, error };
    });

    // AI actions
    this.register("ai", async (text) => {
      const { success, result, error } = await this.context.getUIAgent().ai(text);
      return { success, result, error };
    });

    this.register("aiTap", async (text) => {
      const { success, result, error } = await this.context.getUIAgent().aiTap(text);
      return { success, result, error };
    });

    this.register("aiInput", async (text, arg) => {
      const { success, result, error } = await this.context.getUIAgent().aiInput(arg, text);
      return { success, result, error };
    });

    this.register("aiHover", async (text) => {
      const { success, result, error } = await this.context.getUIAgent().aiHover(text);
      return { success, result, error };
    });

    this.register("aiWaitFor", async (text) => {
      const { success, result, error } = await this.context.getUIAgent().aiWaitFor(text, { timeoutMs: 30000 });
      return { success, result, error };
    });

    this.register("aiKeyboardPress", async (text) => {
      const { success, result, error } = await this.context.getUIAgent().aiKeyboardPress(text);
      return { success, result, error };
    });

    this.register("aiAssert", async (text) => {
      const { success, result, error } = await this.context.getUIAgent().aiAssert(text);
      return { success, result, error };
    });

    // Data action
    this.register("data", async (text) => {
      const { success, result, error } = await this.context.getDataAgent().ask(text);
      return { success, result, error };
    });
  }
}
