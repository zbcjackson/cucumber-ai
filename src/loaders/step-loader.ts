import { loadDefinitions } from "./definition-loader";
import { Step, parseStepDefinitions } from "./step-parser";

export function loadSteps(path?: string): Step[] {
  return loadDefinitions({
    name: "Step",
    directory: "steps",
    ext: "steps",
    parse: parseStepDefinitions,
    path,
  });
}
