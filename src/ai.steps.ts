import {Before, defineStep, setDefaultTimeout, setWorldConstructor} from "@cucumber/cucumber";
import { AgentWorld } from './agent.world';

setWorldConstructor(AgentWorld);
setDefaultTimeout(600 * 1000);

defineStep(/^(.*)$/, async function (this: AgentWorld, stepText: string) {
  await this.agent.executeStep(stepText);
});

Before(async function (this: AgentWorld) {
    await this.agent.start();
})