import { describe, expect, test } from "vitest";
import { Action, parseAction } from "./action-parser";

function testActionParser(actionDefinitions: string, expected: Action) {
  return () => {
    const result = parseAction(actionDefinitions);
    expect(result).toEqual(expected);
  };
}
function expectActionError(actionDefinition: string, expectedError: string) {
  return () => {
    expect(() => parseAction(actionDefinition)).toThrow(expectedError);
  };
}
describe("action parsing", () => {
  test(
    "should parse action",
    testActionParser("ai:click on the button", {
      type: "action",
      name: "ai",
      text: "click on the button",
    }),
  );
  test(
    "should trim whitespaces in action text",
    testActionParser("ai:    click on the button   ", {
      type: "action",
      name: "ai",
      text: "click on the button",
    }),
  );
  test(
    "should trim whitespaces in action name",
    testActionParser("   ai   :click on the button", {
      type: "action",
      name: "ai",
      text: "click on the button",
    }),
  );
  test(
    "should extract arg from action name",
    testActionParser("aiInput(value):the name field", {
      type: "action",
      name: "aiInput",
      arg: "value",
      text: "the name field",
    }),
  );
  test(
    "should throw error if action is declared without action name",
    expectActionError(":click on the button", 'Invalid action format in line: ":click on the button"'),
  );
  test(
    "should throw error if action is declared without colon",
    expectActionError("click on the button", 'Invalid action format in line: "click on the button"'),
  );
  test(
    "should throw error if action is declared without action text",
    expectActionError("ai:", 'Invalid action format in line: "ai:"'),
  );
});
