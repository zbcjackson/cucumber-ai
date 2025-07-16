import * as fs from "node:fs";
import { join } from "node:path";
import { path as rootPath } from "app-root-path";
import { glob } from "glob";
import { Concept, parseConcept } from "./concept-parser";

export function loadConcepts(path?: string): Concept[] {
  let loadPath = path;
  if (!loadPath) {
    loadPath = join(rootPath, "concepts");
  }
  if (fs.lstatSync(loadPath).isDirectory()) {
    const files = glob.sync(join(loadPath, "/**/*.concept"));
    return files.map((file) => loadFromFile(file));
  }
  return [loadFromFile(loadPath)];
}

function loadFromFile(path: string) {
  const conceptDefinition = fs.readFileSync(path, "utf-8");
  return parseConcept(conceptDefinition);
}
