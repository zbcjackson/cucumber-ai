import { Concept, parseConcept } from "./concept-parser";
import { loadDefinitions } from "./definition-loader";

export function loadConcepts(path?: string): Concept[] {
  return loadDefinitions({ name: "Concept", directory: "concepts", ext: "concept", parse: parseConcept, path });
}
