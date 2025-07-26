import { loadDefinitions } from "./definition-loader";
import { Hook, parseHook } from "./hook-parser";

export function loadHooks(path?: string): Hook[] {
  return loadDefinitions({ name: "Hook", directory: "hooks", ext: "hooks", parse: parseHook, path });
}
