import { afterEach, beforeEach, describe, expect, it, MockedFunction, vi } from "vitest";
import "dotenv/config";
import { ActionHandler } from "../src/action-agent/actions";
import { ConceptAgent } from "../src/action-agent/concept-agent";
import { Result } from "../src/llm/openai";
import * as ConceptLoader from "../src/loaders/concept-loader";
import { mockContext } from "./utils";

vi.mock("../src/loaders/concept-loader");

describe("ConceptAgent", () => {
  let conceptAgent: ConceptAgent;
  let context: ReturnType<typeof mockContext>;
  let aiAction: MockedFunction<ActionHandler>;

  beforeEach(() => {
    context = mockContext();
    aiAction = vi.fn().mockResolvedValue({ success: true } as Result);
    context.getActions().register("ai", aiAction);

    vi.mocked(context.getTextAgent().find).mockResolvedValue({
      text: "Check it shows '{{value}}' in the input field",
      args: { value: "name" },
    });

    conceptAgent = new ConceptAgent(context);
    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should register concept actions during start", async () => {
    const mockConcepts = [
      {
        name: "MainPage",
        type: "concept" as const,
        behaviors: [
          {
            type: "behavior" as const,
            text: "Check it shows '{{value}}' in the input field",
            actions: [
              {
                type: "action" as const,
                name: "ai",
                text: "input '[[value]]' in the input field",
              },
            ],
          },
        ],
      },
    ];

    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue(mockConcepts);

    await conceptAgent.start();

    // Verify that the concept action was registered
    expect(context.getActions().has("MainPage")).toBe(true);
  });

  it("should unregister concept actions during stop", async () => {
    const mockConcepts = [
      {
        name: "MainPage",
        type: "concept" as const,
        behaviors: [],
      },
    ];

    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue(mockConcepts);

    await conceptAgent.start();
    expect(context.getActions().has("MainPage")).toBe(true);

    await conceptAgent.stop();
    expect(context.getActions().has("MainPage")).toBe(false);
  });

  it("should execute behavior when concept action is called", async () => {
    const mockConcepts = [
      {
        name: "MainPage",
        type: "concept" as const,
        behaviors: [
          {
            type: "behavior" as const,
            text: "Check it shows '{{value}}' in the input field",
            actions: [
              {
                type: "action" as const,
                name: "ai",
                text: "input '[[value]]' in the input field",
              },
            ],
          },
        ],
      },
    ];

    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue(mockConcepts);
    vi.mocked(context.getTextAgent().find).mockResolvedValue({
      text: "Check it shows '{{value}}' in the input field",
      args: { value: "name" },
    });

    await conceptAgent.start();

    // Execute the concept action
    const result = await context
      .getActions()
      .execute("MainPage", "Check it shows 'name' in the input field", undefined);

    expect(result.success).toBe(true);

    // Verify ActionAgent from context was used
    const mockActionAgent = context.getActionAgent();
    expect(mockActionAgent.executeActions).toHaveBeenCalledWith(
      [
        {
          type: "action" as const,
          name: "ai",
          text: "input '[[value]]' in the input field",
        },
      ],
      { value: "name" },
    );
  });

  it("should throw error for unknown concept", async () => {
    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue([]);

    await conceptAgent.start();

    await expect(conceptAgent.executeBehavior("UnknownConcept", "some text")).rejects.toThrow(
      "Unknown concept: UnknownConcept",
    );
  });

  it("should throw error when no matching behavior is found", async () => {
    const mockConcepts = [
      {
        name: "MainPage",
        type: "concept" as const,
        behaviors: [
          {
            type: "behavior" as const,
            text: "Check it shows '{{value}}' in the input field",
            actions: [],
          },
        ],
      },
    ];

    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue(mockConcepts);
    vi.mocked(context.getTextAgent().find).mockResolvedValue(null);

    await conceptAgent.start();

    await expect(conceptAgent.executeBehavior("MainPage", "some unmatched text")).rejects.toThrow(
      "No matching behavior found for concept MainPage with text: some unmatched text",
    );
  });

  it("should replace argument values in action text", async () => {
    const mockConcepts = [
      {
        name: "MainPage",
        type: "concept" as const,
        behaviors: [
          {
            type: "behavior" as const,
            text: "Check it shows '{{value}}' in the input field",
            actions: [
              {
                type: "action" as const,
                name: "ai",
                text: "input '[[value]]' in the input field",
                arg: "with label '[[label]]'",
              },
            ],
          },
        ],
      },
    ];

    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue(mockConcepts);
    vi.mocked(context.getTextAgent().find).mockResolvedValue({
      text: "Check it shows '{{value}}' in the input field",
      args: { value: "name", label: "username" },
    });

    await conceptAgent.start();

    const result = await context
      .getActions()
      .execute("MainPage", "Check it shows 'name' in the input field", undefined);

    expect(result.success).toBe(true);

    // Verify ActionAgent from context was used with correct arguments
    const mockActionAgent = context.getActionAgent();
    expect(mockActionAgent.executeActions).toHaveBeenCalledWith(
      [
        {
          type: "action" as const,
          name: "ai",
          text: "input '[[value]]' in the input field",
          arg: "with label '[[label]]'",
        },
      ],
      { value: "name", label: "username" },
    );
  });
});
