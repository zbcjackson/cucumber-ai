import * as path from "node:path";
import { vol } from "memfs";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadSteps } from "../../src/loaders/step-loader";

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

describe("StepLoader", () => {
  afterEach(() => {
    vol.reset();
  });
  test("should throw error if step definition file does not exist", () => {
    expect(() => {
      loadSteps(path.join(__dirname, "../test/fixtures/nonexistent.steps"));
    }).toThrow("Step definition file or directory does not exist: ");
  });
  test("should throw error if default steps directory does not exist", () => {
    expect(() => {
      loadSteps();
    }).toThrow("Step definition file or directory does not exist: ");
  });
  test("should return an empty array if default steps directory contains no file", () => {
    vol.mkdirSync(path.join(process.cwd(), "features", "steps"), { recursive: true });
    mocks.sync.mockReturnValue([]);
    expect(loadSteps()).toEqual([]);
  });
});
