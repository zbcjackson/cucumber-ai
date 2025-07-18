import * as path from "node:path";
import {describe, expect, test, vi, beforeEach, afterEach} from "vitest";
import { loadSteps } from "./step-loader";
import { vol } from "memfs";

vi.mock('node:fs')

describe("StepLoader", () => {
    afterEach(() => {
        vol.reset()
    })
    test("should throw error if step definition file does not exist", () => {
        expect(() => {
            loadSteps(path.join(__dirname, "../test/fixtures/nonexistent.steps"));
        }).toThrow("Step definition file or directory does not exist: ");
    });
    test("should throw error if default steps directory does not exist", () => {
        expect(() => {
            loadSteps();
        }).toThrow("Step definition file or directory does not exist: ");
    })
    test("should return an empty array if default steps directory contains no file", () => {
        vol.mkdirSync(path.join(process.cwd(), "steps"), { recursive: true });
        expect(loadSteps()).toEqual([]);
    })
})