import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UIAgent } from "../src/ui-agent";
import "dotenv/config";
import { Driver } from "../src";
import { ActionAgent } from "../src/action-agent";
import { Context } from "../src/context";
import { DataAgent } from "../src/data-agent";
import * as ConceptLoader from "../src/loaders/concept-loader";

vi.mock("../src/loaders/concept-loader");

describe("ActionAgent", () => {
  let uiAgent: UIAgent;
  let dataAgent: DataAgent;
  let driver: Driver;
  let actionAgent: ActionAgent;

  beforeEach(() => {
    uiAgent = {
      start: vi.fn(),
      setDriver: vi.fn(),
      ai: vi.fn(),
      aiTap: vi.fn(),
      aiInput: vi.fn(),
      aiHover: vi.fn(),
      aiWaitFor: vi.fn(),
      aiKeyboardPress: vi.fn(),
      aiAssert: vi.fn(),
    } as unknown as UIAgent;
    dataAgent = {
      start: vi.fn(),
      stop: vi.fn(),
      ask: vi.fn(),
    } as unknown as DataAgent;
    driver = {} as unknown as Driver;

    // Create a mock Context class
    const mockContext = {
      getAgents: vi.fn().mockReturnValue({
        getUIAgent: vi.fn().mockReturnValue(uiAgent),
        getDataAgent: vi.fn().mockReturnValue(dataAgent),
        getTextAgent: vi.fn().mockReturnValue({
          find: vi
            .fn()
            .mockResolvedValue({ text: "Check it shows '{{value}}' in the input field", args: { value: "name" } }),
        }),
      }),
    } as unknown as Context;

    actionAgent = new ActionAgent(mockContext);
    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue([]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("should execute defined steps", async () => {
    await actionAgent.start();
    await actionAgent.executeActions([
      {
        name: "ai",
        type: "action",
        text: "click add button",
      },
    ]);
    expect(uiAgent.ai).toHaveBeenCalledWith("click add button");
  });
  it("should execute defined step with parameter", async () => {
    await actionAgent.start();
    await actionAgent.executeActions(
      [
        {
          name: "ai",
          type: "action",
          text: "click add button",
        },
      ],
      { value: "name" },
    );
    expect(uiAgent.ai).toHaveBeenCalledWith("click add button");
  });
  it("should replace parameter in the action text", async () => {
    await actionAgent.start();
    await actionAgent.executeActions(
      [
        {
          name: "ai",
          type: "action",
          text: "input '[[value]]' in the input field",
        },
      ],
      { value: "name" },
    );
    expect(uiAgent.ai).toHaveBeenCalledWith("input 'name' in the input field");
  });
  it("should match step with same intention", async () => {
    await actionAgent.start();
    await actionAgent.executeActions(
      [
        {
          name: "ai",
          type: "action",
          text: "input '[[value]]' in the input field",
        },
      ],
      { value: "name" },
    );
    expect(uiAgent.ai).toHaveBeenCalledWith("input 'name' in the input field");
  });
  it("should support concept behaviors", async () => {
    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue([
      {
        name: "MainPage",
        type: "concept",
        behaviors: [
          {
            type: "behavior",
            text: "Check it shows '{{value}}' in the input field",
            actions: [
              {
                type: "action",
                name: "ai",
                text: "input '[[value]]' in the input field",
              },
            ],
          },
        ],
      },
    ]);
    await actionAgent.start();
    await actionAgent.executeActions(
      [
        {
          name: "MainPage",
          type: "action",
          text: "Check it shows '[[value]]' in the input field",
        },
      ],
      { value: "name" },
    );
    expect(uiAgent.ai).toHaveBeenCalledWith("input 'name' in the input field");
  }, 300000);
});
