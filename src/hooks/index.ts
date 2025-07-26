import { Before } from "@cucumber/cucumber";
import { AgentWorld } from "../agent.world";
import { loadHooks } from "../loaders/hook-loader";

export function setupHooks() {
  const hooks = loadHooks();
  for (const hook of hooks) {
    Before(hook.tags, async function (this: AgentWorld) {
      await this.executeActions(hook.actions);
    });
  }
}
