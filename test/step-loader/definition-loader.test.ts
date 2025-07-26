import * as path from "node:path";
import { vol } from "memfs";
import { afterEach, describe, expect, test, vi } from "vitest";
import { loadDefinitions } from "../../src/loaders/definition-loader";
import { parseStepDefinitions } from "../../src/loaders/step-parser";

const mocks = vi.hoisted(() => {
  return {
    sync: vi.fn(),
  };
});
vi.mock("node:fs");
vi.mock("glob", () => ({
  glob: {
    sync: mocks.sync,
  },
}));

describe("DefinitionLoader", () => {
  afterEach(() => {
    vol.reset();
  });
  test("should throw error if definition file does not exist", () => {
    expect(() => {
      loadDefinitions({
        name: "Step",
        directory: "steps",
        ext: "steps",
        parse: parseStepDefinitions,
        path: path.join(__dirname, "../test/fixtures/nonexistent.steps"),
      });
    }).toThrow("Step definition file or directory does not exist: ");
  });
  test("should throw error if default steps directory does not exist", () => {
    expect(() => {
      loadDefinitions({ name: "Step", directory: "steps", ext: "steps", parse: parseStepDefinitions });
    }).toThrow("Step definition file or directory does not exist: ");
  });
  test("should return an empty array if default steps directory contains no file", () => {
    vol.mkdirSync(path.join(process.cwd(), "features", "steps"), { recursive: true });
    mocks.sync.mockReturnValue([]);
    expect(loadDefinitions({ name: "Step", directory: "steps", ext: "steps", parse: parseStepDefinitions })).toEqual(
      [],
    );
  });
});
