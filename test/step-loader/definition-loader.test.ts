import * as path from "node:path";
import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadDefinitions } from "../../src/step-loader/definition-loader";
import { loadSteps } from "../../src/step-loader/step-loader";
import { parseStepDefinitions } from "../../src/step-loader/step-parser";

vi.mock("node:fs");

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
    vol.mkdirSync(path.join(process.cwd(), "steps"), { recursive: true });
    expect(loadDefinitions({ name: "Step", directory: "steps", ext: "steps", parse: parseStepDefinitions })).toEqual(
      [],
    );
  });
});
