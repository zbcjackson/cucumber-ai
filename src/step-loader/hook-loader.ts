import * as fs from "node:fs";
import { join } from "node:path";
import { path as rootPath } from "app-root-path";
import { glob } from "glob";
import { Hook, parseHook } from "./hook-parser";

export function loadHooks(path?: string): Hook[] {
  let loadPath = path;
  if (!loadPath) {
    loadPath = join(rootPath, "hooks");
  }
  if (!fs.existsSync(loadPath)) {
    throw new Error(`Hook definition file or directory does not exist: ${loadPath}`);
  }
  if (fs.lstatSync(loadPath).isDirectory()) {
    const files = glob.sync(join(loadPath, "/**/*.hooks"));
    return files.flatMap((file) => loadFromFile(file));
  }
  return loadFromFile(loadPath);
}

function loadFromFile(path: string) {
  const hookDefinitions = fs.readFileSync(path, "utf-8");
  return parseHook(hookDefinitions);
}
