import { parseAction } from "./action-parser";
import { Action } from "./action-parser";

export interface Concept {
  name: string;
  type: "concept";
  behaviors: Behavior[];
}
export interface Behavior {
  type: "behavior";
  text: string;
  actions: Action[];
}

export function parseConcept(conceptDefinition: string): Concept {
  const concept: Concept = {
    name: "",
    type: "concept",
    behaviors: [],
  };
  for (const line of conceptDefinition.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "") {
      continue;
    }
    if (trimmed.startsWith("Concept:")) {
      concept.name = extractConceptName(trimmed, concept);
      continue;
    }
    if (trimmed.startsWith("Behavior:")) {
      concept.behaviors.push({
        type: "behavior",
        text: extractBehaviorText(trimmed),
        actions: [],
      });
      continue;
    }
    if (concept.behaviors.length <= 0) {
      throw new Error(`No behavior found for action "${trimmed}"`);
    }
    concept.behaviors[concept.behaviors.length - 1].actions.push(parseAction(trimmed));
  }

  return concept;
}

function extractConceptName(trimmed: string, concept: Concept) {
  const name = trimmed.slice(8).trim();
  if (name === "") {
    throw new Error(`Concept name cannot be empty in definition: "${trimmed}"`);
  }
  if (name.includes(":")) {
    throw new Error(`Invalid concept definition format: "${trimmed}"`);
  }
  if (concept.name !== "") {
    throw new Error(`Only one concept could be defined: "${trimmed}"`);
  }
  return name;
}

function extractBehaviorText(trimmed: string) {
  const behaviorText = trimmed.slice(9).trim();
  if (behaviorText === "") {
    throw new Error(`Behavior text cannot be empty in definition: "${trimmed}"`);
  }
  return behaviorText;
}
