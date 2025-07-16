import * as fs from "node:fs";
import { join } from "node:path";
import { path as rootPath } from "app-root-path";
import { glob } from "glob";
import { Step, parseStepDefinitions } from "./step-parser";

export function loadSteps(path?: string): Step[] {
  let loadPath = path;
  if (!loadPath) {
    loadPath = join(rootPath, "steps");
  }
  if (fs.lstatSync(loadPath).isDirectory()) {
    const files = glob.sync(join(loadPath, "/**/*.steps"));
    return files.flatMap((file) => loadFromFile(file));
  }
  return loadFromFile(loadPath);
}

function loadFromFile(path: string) {
  const stepDefinitions = fs.readFileSync(path, "utf-8");
  return parseStepDefinitions(stepDefinitions);
}
