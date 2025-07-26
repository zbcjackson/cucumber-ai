import { describe, expect, test } from "vitest";
import { Hook, parseHook } from "../../src/loaders/hook-parser";

function testHookParser(hookDefinitions: string, expected: Hook[]) {
  return () => {
    const result = parseHook(hookDefinitions);
    expect(result).toEqual(expected);
  };
}
function expectHookError(hookDefinition: string, expectedError: string) {
  return () => {
    expect(() => parseHook(hookDefinition)).toThrow(expectedError);
  };
}
describe("hook parser", () => {
  test(
    "should parse hook definition start with 'Before:'",
    testHookParser("Before:", [
      {
        tags: "",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should ignore leading and tailing whitespaces in hook definition",
    testHookParser("   Before:  @admin   ", [
      {
        tags: "@admin",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should ignore whitespaces between 'Before:' and hook tags",
    testHookParser("Before:    @admin", [
      {
        tags: "@admin",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should ignore empty lines in hook definitions",
    testHookParser("\nBefore: @admin\n", [
      {
        tags: "@admin",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should parse multiple hook definitions",
    testHookParser("Before: @admin\nBefore: @user", [
      {
        tags: "@admin",
        type: "hook",
        actions: [],
      },
      {
        tags: "@user",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should parse multiple actions under hook definition",
    testHookParser("Before: @admin\nai:click on the button\nai:fill the form", [
      {
        tags: "@admin",
        type: "hook",
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
  test(
    "should throw error if action is declared without step definition",
    expectHookError("ai:click on the button", 'No hook definition found for action "ai:click on the button"'),
  );
  test(
    "should parse multiple step definitions with actions",
    testHookParser("Before: \nai:click on the button\nBefore: @admin\nai:fill the form", [
      {
        tags: "",
        type: "hook",
        actions: [
          {
            type: "action",
            name: "ai",
            text: "click on the button",
          },
        ],
      },
      {
        tags: "@admin",
        type: "hook",
        actions: [
          {
            type: "action",
            name: "ai",
            text: "fill the form",
          },
        ],
      },
    ]),
  );
});
