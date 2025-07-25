import { After, Before, setDefaultTimeout, setWorldConstructor } from "@cucumber/cucumber";
import { AgentWorld } from "./agent.world";

setWorldConstructor(AgentWorld);
setDefaultTimeout(600 * 1000);

Before(async function (this: AgentWorld) {
  await this.agent.start();
});

After(async function (this: AgentWorld) {
  await this.quit();
});
