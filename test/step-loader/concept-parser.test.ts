import { describe, expect, test } from "vitest";
import { Concept, parseConcept } from "../../src/step-loader/concept-parser";

function testConceptParser(conceptDefinition: string, expected: Concept) {
  return () => {
    const result = parseConcept(conceptDefinition);
    expect(result).toEqual(expected);
  };
}
function expectConceptError(conceptDefinition: string, expectedError: string) {
  return () => {
    expect(() => parseConcept(conceptDefinition)).toThrow(expectedError);
  };
}
describe("ConceptParser", () => {
  describe("concept name", () => {
    test(
      "should parse concept name",
      testConceptParser("Concept:LoginPage", {
        name: "LoginPage",
        type: "concept",
        behaviors: [],
      }),
    );
    test("should trim concept name", () => {
      const concept = parseConcept("Concept: LoginPage ");
      expect(concept).toEqual({
        name: "LoginPage",
        type: "concept",
        behaviors: [],
      });
    });
    test(
      "concept name should not be empty",
      expectConceptError("Concept: ", 'Concept name cannot be empty in definition: "Concept:"'),
    );
    test(
      "concept name should not contain any colons",
      expectConceptError("Concept:Login:Page", 'Invalid concept definition format: "Concept:Login:Page"'),
    );
    test(
      "only one concept could be defined",
      expectConceptError(
        "Concept: LoginPage\nConcept: MainPage",
        'Only one concept could be defined: "Concept: MainPage"',
      ),
    );
  });
  describe("behaviors", () => {
    test(
      "should parse behavior text",
      testConceptParser("Concept:LoginPage\nBehavior:login", {
        name: "LoginPage",
        type: "concept",
        behaviors: [
          {
            type: "behavior",
            text: "login",
            actions: [],
          },
        ],
      }),
    );
    test(
      "should trim behavior text",
      testConceptParser("Concept:LoginPage\nBehavior: login ", {
        name: "LoginPage",
        type: "concept",
        behaviors: [
          {
            type: "behavior",
            text: "login",
            actions: [],
          },
        ],
      }),
    );
    test(
      "behavior text should not be empty",
      expectConceptError("Concept:LoginPage\nBehavior: ", 'Behavior text cannot be empty in definition: "Behavior:"'),
    );
    test(
      "action should not be defined without behavior",
      expectConceptError(
        "Concept:LoginPage\nai:click the button",
        'No behavior found for action "ai:click the button"',
      ),
    );
    test(
      "should parse actions in behavior",
      testConceptParser("Concept:LoginPage\nBehavior: login\nai:click the button\naiWaitFor:Welcome is shown", {
        name: "LoginPage",
        type: "concept",
        behaviors: [
          {
            type: "behavior",
            text: "login",
            actions: [
              {
                type: "action",
                name: "ai",
                text: "click the button",
              },
              {
                type: "action",
                name: "aiWaitFor",
                text: "Welcome is shown",
              },
            ],
          },
        ],
      }),
    );
    test(
      "should parse multiple behaviors with multiple actions",
      testConceptParser(
        "Concept:LoginPage\nBehavior: login\nai:click the button\nBehavior: logout\nai:click the logout button",
        {
          name: "LoginPage",
          type: "concept",
          behaviors: [
            {
              type: "behavior",
              text: "login",
              actions: [
                {
                  type: "action",
                  name: "ai",
                  text: "click the button",
                },
              ],
            },
            {
              type: "behavior",
              text: "logout",
              actions: [
                {
                  type: "action",
                  name: "ai",
                  text: "click the logout button",
                },
              ],
            },
          ],
        },
      ),
    );
  });
  test(
    "ignore empty lines",
    testConceptParser(
      "\nConcept:LoginPage\n\nBehavior: login\n\nai:click the button\n\naiWaitFor:Welcome is shown\n\n",
      {
        name: "LoginPage",
        type: "concept",
        behaviors: [
          {
            type: "behavior",
            text: "login",
            actions: [
              {
                type: "action",
                name: "ai",
                text: "click the button",
              },
              {
                type: "action",
                name: "aiWaitFor",
                text: "Welcome is shown",
              },
            ],
          },
        ],
      },
    ),
  );
});
