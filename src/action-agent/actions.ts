import { Context } from "../context";

export type ActionHandler = (
  text: string,
  arg: string | undefined,
) => Promise<{ success: boolean; result?: Record<string, string>; error?: string }>;

export class Actions {
  private handlers: Map<string, ActionHandler> = new Map();

  register(name: string, handler: ActionHandler): void {
    this.handlers.set(name, handler);
  }

  async execute(
    name: string,
    text: string,
    arg: string | undefined,
  ): Promise<{ success: boolean; result?: Record<string, string>; error?: string }> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return {
        success: false,
        error: `Unknown action: ${name}`,
      };
    }

    try {
      return await handler(text, arg);
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
}
