import path from "node:path";
import { vol } from "memfs";
import { afterEach, describe, expect, test, vi } from "vitest";
import { loadConcepts } from "../../src/loaders/concept-loader";

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

describe("Concept Loader", () => {
  afterEach(() => {
    vol.reset();
  });
  test("should throw error if concept definition file does not exist", () => {
    expect(() => {
      loadConcepts(path.join(__dirname, "../test/fixtures/nonexistent.concept"));
    }).toThrow("Concept definition file or directory does not exist: ");
  });
  test("should throw error if default concepts directory does not exist", () => {
    expect(() => {
      loadConcepts();
    }).toThrow("Concept definition file or directory does not exist: ");
  });
  test("should return an empty array if default concepts directory contains no file", () => {
    vol.mkdirSync(path.join(process.cwd(), "features", "concepts"), { recursive: true });
    mocks.sync.mockReturnValue([]);
    expect(loadConcepts()).toEqual([]);
  });
});
