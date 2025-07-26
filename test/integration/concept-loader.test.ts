import * as path from "node:path";
import { describe, expect, test } from "vitest";
import { loadConcepts } from "../../src/loaders/concept-loader";

describe("Concept Loader", () => {
  test("should load concept definitions from a specified file", () => {
    const steps = loadConcepts(path.join(__dirname, "../fixtures/test.concept"));
    expect(steps).toEqual([
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
                text: 'input "username" in the username field',
              },
              {
                type: "action",
                name: "ai",
                text: 'input "password" in the password field',
              },
              {
                type: "action",
                name: "ai",
                text: "click the login button",
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
    ]);
  });
  test("should load concept definitions from a specified directory", () => {
    const steps = loadConcepts(path.join(__dirname, "../fixtures/concepts"));
    expect(steps).toEqual([
      {
        name: "One",
        type: "concept",
        behaviors: [
          {
            type: "behavior",
            text: "first",
            actions: [
              {
                type: "action",
                name: "ai",
                text: "click the first button",
              },
            ],
          },
        ],
      },
      {
        name: "Two",
        type: "concept",
        behaviors: [
          {
            type: "behavior",
            text: "second",
            actions: [
              {
                type: "action",
                name: "ai",
                text: "click the second button",
              },
            ],
          },
        ],
      },
    ]);
  });
});
