import { loadDefinitions } from "./definition-loader";
import { parseStepDefinitions, Step } from "./step-parser";

export function loadSteps(path?: string): Step[] {
  return loadDefinitions({
    name: "Step",
    directory: "steps",
    ext: "steps",
    parse: parseStepDefinitions,
    path,
  });
}
