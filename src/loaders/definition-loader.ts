import fs from "node:fs";
import { join } from "node:path";
import { path as rootPath } from "app-root-path";
import { glob } from "glob";

interface Options<T> {
  name: string;
  directory: string;
  ext: string;
  parse: (definitions: string) => T | T[];
  path?: string;
}
export function loadDefinitions<T>(options: Options<T>): T[] {
  function loadFromFile(filePath: string): T | T[] {
    const definitions = fs.readFileSync(filePath, "utf-8");
    return options.parse(definitions);
  }
  let loadPath = options.path;
  if (!loadPath) {
    loadPath = join(rootPath, "features", options.directory);
  }
  if (!fs.existsSync(loadPath)) {
    throw new Error(`${options.name} definition file or directory does not exist: ${loadPath}`);
  }
  if (fs.lstatSync(loadPath).isDirectory()) {
    const files = glob.sync(join(loadPath, `/**/*.${options.ext}`));
    return files.flatMap((file) => loadFromFile(file));
  }
  const parsed = loadFromFile(loadPath);
  return Array.isArray(parsed) ? parsed : [parsed];
}
