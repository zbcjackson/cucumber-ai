import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { loadSteps } from "../../src/step-loader/step-loader";

describe("StepLoader", () => {
  test("should load step definitions from a specified file", () => {
    const steps = loadSteps(path.join(__dirname, "../fixtures/test.steps"));
    expect(steps).toEqual([
      {
        text: "login via password",
        type: "step",
        actions: [
          {
            type: "action",
            name: "ai",
            text: 'input user name with value "username"',
          },
          {
            type: "action",
            name: "ai",
            text: 'input password with value "password"',
          },
          {
            type: "action",
            name: "ai",
            text: 'click button with text "Login"',
          },
        ],
      },
      {
        text: "check that user is logged in",
        type: "step",
        actions: [
          {
            type: "action",
            name: "ai",
            text: 'check it shows user name "John Doe" in the header',
          },
        ],
      },
    ]);
  });
  test("should load step definitions from a specified directory", () => {
    const steps = loadSteps(path.join(__dirname, "../fixtures/steps"));
    expect(steps).toEqual([
      {
        text: "one",
        type: "step",
        actions: [
          {
            type: "action",
            name: "ai",
            text: "input one",
          },
        ],
      },
      {
        text: "two",
        type: "step",
        actions: [
          {
            type: "action",
            name: "ai",
            text: "input two",
          },
        ],
      },
    ]);
  });
});
