import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { path as rootPath } from "app-root-path";

export class Cache {
  constructor(private name: string) {}

  public readCache(text: string) {
    const cacheFilePath = this.getCacheFilePath(text);
    if (fs.existsSync(cacheFilePath)) {
      return JSON.parse(fs.readFileSync(cacheFilePath, { encoding: "utf-8" }));
    }
    return null;
  }

  public writeCache(text: string, object: unknown) {
    const cacheFilePath = this.getCacheFilePath(text);
    fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
    fs.writeFileSync(cacheFilePath, JSON.stringify(object, null, 2), { encoding: "utf-8" });
  }

  private getCacheFilePath(text: string) {
    const hash = crypto.createHash("md5").update(text).digest("hex");
    const cacheFile = `./cache/${this.name}/${hash}.json`;
    return path.join(rootPath, cacheFile);
  }
}
