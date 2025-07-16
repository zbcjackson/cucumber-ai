import { defineStep } from "@cucumber/cucumber";
import { AgentWorld } from './agent.world';

defineStep(/^(.*)$/, async function (this: AgentWorld, stepText: string) {
  await this.agent.executeStep(stepText);
});
