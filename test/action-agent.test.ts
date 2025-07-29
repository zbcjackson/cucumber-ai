import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UIAgent } from "../src/ui-agent";
import "dotenv/config";
import { ActionAgent } from "../src/action-agent";
import { DataAgent } from "../src/data-agent";
import * as ConceptLoader from "../src/loaders/concept-loader";
import { mockContext } from "./utils";

vi.mock("../src/loaders/concept-loader");

describe("ActionAgent", () => {
  let uiAgent: UIAgent;
  let dataAgent: DataAgent;
  let actionAgent: ActionAgent;
  let context: ReturnType<typeof mockContext>;

  beforeEach(() => {
    context = mockContext();
    uiAgent = context.getUIAgent();
    dataAgent = context.getDataAgent();

    vi.mocked(context.getTextAgent().find).mockResolvedValue({
      text: "Check it shows '{{value}}' in the input field",
      args: { value: "name" },
    });

    actionAgent = new ActionAgent(context);
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
