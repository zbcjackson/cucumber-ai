import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UIAgent } from "../ui-agent";
import { StepAgent } from "./index";
import "dotenv/config";
import * as ConceptLoader from "../step-loader/concept-loader";
import * as StepLoader from "../step-loader/step-loader";

vi.mock("../step-loader/step-loader");
vi.mock("../step-loader/concept-loader");
describe("Step Agent", () => {
  let uiAgent: UIAgent;
  let stepAgent: StepAgent;
  beforeEach(() => {
    uiAgent = {
      init: vi.fn(),
      ai: vi.fn(),
      aiTap: vi.fn(),
      aiInput: vi.fn(),
      aiHover: vi.fn(),
      aiWaitFor: vi.fn(),
      aiKeyboardPress: vi.fn(),
      aiAssert: vi.fn(),
    } as unknown as UIAgent;
    stepAgent = new StepAgent();
    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue([]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("should execute defined steps", async () => {
    vi.mocked(StepLoader.loadSteps).mockReturnValue([
      {
        text: "add",
        type: "step",
        actions: [
          {
            name: "ai",
            type: "action",
            text: "click add button",
          },
        ],
      },
    ]);
    stepAgent.start();
    await stepAgent.executeStep("add");
    expect(uiAgent.ai).toHaveBeenCalledWith("click add button");
  });
  it("should execute defined step with parameter", async () => {
    vi.mocked(StepLoader.loadSteps).mockReturnValue([
      {
        text: "add '{{value}}'",
        type: "step",
        actions: [
          {
            name: "ai",
            type: "action",
            text: "click add button",
          },
        ],
      },
    ]);
    stepAgent.start();
    await stepAgent.executeStep("add 'name'");
    expect(uiAgent.ai).toHaveBeenCalledWith("click add button");
  });
  it("should replace parameter in the action text", async () => {
    vi.mocked(StepLoader.loadSteps).mockReturnValue([
      {
        text: "add '{{value}}'",
        type: "step",
        actions: [
          {
            name: "ai",
            type: "action",
            text: "input '[[value]]' in the input field",
          },
        ],
      },
    ]);
    stepAgent.start();
    await stepAgent.executeStep("add 'name'");
    expect(uiAgent.ai).toHaveBeenCalledWith("input 'name' in the input field");
  });
  it("should match step with same intention", async () => {
    vi.mocked(StepLoader.loadSteps).mockReturnValue([
      {
        text: 'the thought "{{value}}" is shown',
        type: "step",
        actions: [
          {
            name: "ai",
            type: "action",
            text: "input '[[value]]' in the input field",
          },
        ],
      },
    ]);
    stepAgent.start();
    await stepAgent.executeStep("it should show the thought 'name'");
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
    vi.mocked(StepLoader.loadSteps).mockReturnValue([
      {
        text: 'the thought "{{value}}" is shown',
        type: "step",
        actions: [
          {
            name: "MainPage",
            type: "action",
            text: "Check it shows '[[value]]' in the input field",
          },
        ],
      },
    ]);
    stepAgent.start();
    await stepAgent.executeStep("it should show the thought 'name'");
    expect(uiAgent.ai).toHaveBeenCalledWith("input 'name' in the input field");
  }, 300000);
});
