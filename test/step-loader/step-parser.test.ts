import { describe, expect, test } from "vitest";
import { Step, parseStepDefinitions } from "../../src/loaders/step-parser";

function testStepParser(stepDefinitions: string, expected: Step[]) {
  return () => {
    const result = parseStepDefinitions(stepDefinitions);
    expect(result).toEqual(expected);
  };
}

describe("StepParser", () => {
  describe("step text parsing", () => {
    test(
      "should parse step definition start with 'Step:'",
      testStepParser("Step:I have a step definition", [
        {
          text: "I have a step definition",
          type: "step",
          actions: [],
        },
      ]),
    );
    test(
      "should ignore leading and tailing whitespaces in step definition",
      testStepParser("   Step:I have a step definition    ", [
        {
          text: "I have a step definition",
          type: "step",
          actions: [],
        },
      ]),
    );
    test(
      "should ignore whitespaces between 'Step:' and step text",
      testStepParser("Step:    I have a step definition", [
        {
          text: "I have a step definition",
          type: "step",
          actions: [],
        },
      ]),
    );
    test(
      "should ignore empty lines in step definitions",
      testStepParser("\nStep: I have a step definition\n", [
        {
          text: "I have a step definition",
          type: "step",
          actions: [],
        },
      ]),
    );
    test(
      "should parse multiple step definitions",
      testStepParser("Step: I have a step definition\nStep: I have another step definition", [
        {
          text: "I have a step definition",
          type: "step",
          actions: [],
        },
        {
          text: "I have another step definition",
          type: "step",
          actions: [],
        },
      ]),
    );
    test(
      "should parse multiple actions under step definition",
      testStepParser("Step: I have a step definition with multiple actions\nai:click on the button\nai:fill the form", [
        {
          text: "I have a step definition with multiple actions",
          type: "step",
          actions: [
            {
              type: "action",
              name: "ai",
              text: "click on the button",
            },
            {
              type: "action",
              name: "ai",
              text: "fill the form",
            },
          ],
        },
      ]),
    );
    test("should throw error if step text is empty", () => {
      expect(() => {
        parseStepDefinitions("Step:");
      }).toThrow('Invalid step definition format in line: "Step:"');
    });
    test("should throw error if action is declared without step definition", () => {
      expect(() => {
        parseStepDefinitions("ai:click on the button");
      }).toThrow('No step definition found for action "ai:click on the button"');
    });
  });
  test(
    "should parse multiple step definitions with actions",
    testStepParser(
      "Step: I have a step definition\nai:click on the button\nStep: I have another step definition\nai:fill the form",
      [
        {
          text: "I have a step definition",
          type: "step",
          actions: [
            {
              type: "action",
              name: "ai",
              text: "click on the button",
            },
          ],
        },
        {
          text: "I have another step definition",
          type: "step",
          actions: [
            {
              type: "action",
              name: "ai",
              text: "fill the form",
            },
          ],
        },
      ],
    ),
  );
});
