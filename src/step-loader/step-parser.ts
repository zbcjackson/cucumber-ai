import { Action, parseAction } from "./action-parser";

export interface Step {
  text: string;
  type: "step";
  actions: Action[];
}

export function parseStepDefinitions(stepDefinitions: string): Step[] {
  const steps: Step[] = [];

  let step: Step = null;
  for (const line of stepDefinitions.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") {
      continue;
    }

    if (trimmed.startsWith("Step:")) {
      const text = trimmed.slice(5).trim();
      if (text === "") {
        throw new Error(`Invalid step definition format in line: "${trimmed}"`);
      }
      step = {
        text: text,
        type: "step",
        actions: [],
      };
      steps.push(step);
    } else if (step) {
      step.actions.push(parseAction(trimmed));
    } else {
      throw new Error(`No step definition found for action "${line}"`);
    }
  }

  return steps;
}
