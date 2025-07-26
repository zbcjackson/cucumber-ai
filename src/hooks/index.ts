import { After, Before } from "@cucumber/cucumber";
import { AgentWorld } from "../agent.world";
import { loadHooks } from "../loaders/hook-loader";

export function setupHooks() {
  const hooks = loadHooks();
  for (const hook of hooks) {
    switch (hook.hook) {
      case "before":
        Before(hook.tags, async function (this: AgentWorld) {
          await this.executeActions(hook.actions);
        });
        break;
      case "after":
        After(hook.tags, async function (this: AgentWorld) {
          await this.executeActions(hook.actions);
        });
        break;
    }
  }
}
