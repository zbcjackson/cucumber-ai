import { After, Before, ITestCaseHookParameter, setDefaultTimeout, setWorldConstructor } from "@cucumber/cucumber";
import { AgentWorld } from "./agent.world";

setWorldConstructor(AgentWorld);
setDefaultTimeout(600 * 1000);

Before(async function (this: AgentWorld) {
  await this.agent.start();
});

After(async function (this: AgentWorld, scenario: ITestCaseHookParameter) {
  if (scenario.result.status === "FAILED") {
    await this.driver.saveScreenshot(scenario.pickle.name);
    await this.driver.saveVideo(scenario.pickle.name);
  } else {
    await this.driver.deleteVideo();
  }
  await this.quit();
});
