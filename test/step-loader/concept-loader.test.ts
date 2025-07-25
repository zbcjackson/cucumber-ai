import path from "node:path";
import { vol } from "memfs";
import { afterEach, describe, expect, test, vi } from "vitest";
import { loadConcepts } from "../../src/step-loader/concept-loader";

vi.mock("node:fs");

describe("Concept Loader", () => {
  afterEach(() => {
    vol.reset();
  });
  test("should throw error if concept definition file does not exist", () => {
    expect(() => {
      loadConcepts(path.join(__dirname, "../test/fixtures/nonexistent.concept"));
    }).toThrow("Concept file or directory does not exist: ");
  });
  test("should throw error if default concepts directory does not exist", () => {
    expect(() => {
      loadConcepts();
    }).toThrow("Concept file or directory does not exist: ");
  });
  test("should return an empty array if default concepts directory contains no file", () => {
    vol.mkdirSync(path.join(process.cwd(), "concepts"), { recursive: true });
    expect(loadConcepts()).toEqual([]);
  });
});
