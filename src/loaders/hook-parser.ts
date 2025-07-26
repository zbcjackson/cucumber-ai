import { Action, parseAction } from "./action-parser";

export interface Hook {
  hook: "before" | "after";
  tags: string;
  type: "hook";
  actions: Action[];
}

export function parseHook(hookDefinitions: string): Hook[] {
  const hooks: Hook[] = [];

  let hook: Hook = null;
  for (const line of hookDefinitions.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") {
      continue;
    }

    if (trimmed.startsWith("Before:")) {
      const tags = trimmed.slice(7).trim();
      hook = {
        hook: "before",
        tags: tags,
        type: "hook",
        actions: [],
      };
      hooks.push(hook);
    } else if (hook) {
      hook.actions.push(parseAction(trimmed));
    } else {
      throw new Error(`No hook definition found for action "${line}"`);
    }
  }

  return hooks;
}
