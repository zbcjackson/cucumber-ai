import { describe, expect, test } from "vitest";
import { Hook, parseHook } from "../../src/step-loader/hook-parser";

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
    "should parse hook definition start with 'Hook:'",
    testHookParser("Hook:", [
      {
        tags: "",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should ignore leading and tailing whitespaces in hook definition",
    testHookParser("   Hook:  @admin   ", [
      {
        tags: "@admin",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should ignore whitespaces between 'Hook:' and hook tags",
    testHookParser("Hook:    @admin", [
      {
        tags: "@admin",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should ignore empty lines in hook definitions",
    testHookParser("\nHook: @admin\n", [
      {
        tags: "@admin",
        type: "hook",
        actions: [],
      },
    ]),
  );
  test(
    "should parse multiple hook definitions",
    testHookParser("Hook: @admin\nHook: @user", [
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
    testHookParser("Hook: @admin\nai:click on the button\nai:fill the form", [
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
    testHookParser("Hook: \nai:click on the button\nHook: @admin\nai:fill the form", [
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
