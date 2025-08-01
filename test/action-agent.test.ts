import { MockedFunction, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "dotenv/config";
import { ActionAgent } from "../src/action-agent";
import { ActionHandler } from "../src/action-agent/actions";
import { Result } from "../src/llm/openai";
import * as ConceptLoader from "../src/loaders/concept-loader";
import { mockContext } from "./utils";

vi.mock("../src/loaders/concept-loader");

describe("ActionAgent", () => {
  let actionAgent: ActionAgent;
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
    expect(aiAction).toHaveBeenCalledWith("click add button", undefined);
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
    expect(aiAction).toHaveBeenCalledWith("click add button", undefined);
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
    expect(aiAction).toHaveBeenCalledWith("input 'name' in the input field", undefined);
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
    expect(aiAction).toHaveBeenCalledWith("input 'name' in the input field", undefined);
  });
});
