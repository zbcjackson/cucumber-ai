import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepAgent } from "../../src";
import "dotenv/config";
import * as StepLoader from "../../src/loaders/step-loader";
import { ActionAgent } from "../../src/action-agent";
import { Context } from "../../src/context";

vi.mock("../../src/loaders/step-loader");

describe("Step Agent", () => {
  let stepAgent: StepAgent;
  let actionAgent: ActionAgent;

  beforeEach(() => {
    actionAgent = {
      start: vi.fn(),
      executeActions: vi.fn(),
    } as unknown as ActionAgent;

    // Create a mock TextAgent
    const textAgent = {
      find: vi.fn(),
    };

    // Create a mock Context class
    const mockContext = {
      getAgents: vi.fn().mockReturnValue({
        getActionAgent: vi.fn().mockReturnValue(actionAgent),
        getTextAgent: vi.fn().mockReturnValue(textAgent),
      }),
    } as unknown as Context;

    stepAgent = new StepAgent(mockContext);
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

    // Mock TextAgent find method
    const mockContext = stepAgent["context"] as any;
    const textAgent = mockContext.getAgents().getTextAgent();
    vi.mocked(textAgent.find).mockResolvedValue({ text: "add", args: {} });

    await stepAgent.start();
    await stepAgent.executeStep("add");
    expect(actionAgent.executeActions).toHaveBeenCalledWith(
      [
        {
          name: "ai",
          type: "action",
          text: "click add button",
        },
      ],
      {},
    );
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

    // Mock TextAgent find method
    const mockContext = stepAgent["context"] as any;
    const textAgent = mockContext.getAgents().getTextAgent();
    vi.mocked(textAgent.find).mockResolvedValue({ text: "add '{{value}}'", args: { value: "name" } });

    await stepAgent.start();
    await stepAgent.executeStep("add 'name'");
    expect(actionAgent.executeActions).toHaveBeenCalledWith(
      [
        {
          name: "ai",
          type: "action",
          text: "click add button",
        },
      ],
      { value: "name" },
    );
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

    // Mock TextAgent find method
    const mockContext = stepAgent["context"] as any;
    const textAgent = mockContext.getAgents().getTextAgent();
    vi.mocked(textAgent.find).mockResolvedValue({ text: "add '{{value}}'", args: { value: "name" } });

    await stepAgent.start();
    await stepAgent.executeStep("add 'name'");
    expect(actionAgent.executeActions).toHaveBeenCalledWith(
      [
        {
          name: "ai",
          type: "action",
          text: "input '[[value]]' in the input field",
        },
      ],
      { value: "name" },
    );
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

    // Mock TextAgent find method
    const mockContext = stepAgent["context"] as any;
    const textAgent = mockContext.getAgents().getTextAgent();
    vi.mocked(textAgent.find).mockResolvedValue({ text: 'the thought "{{value}}" is shown', args: { value: "name" } });

    await stepAgent.start();
    await stepAgent.executeStep("it should show the thought 'name'");
    expect(actionAgent.executeActions).toHaveBeenCalledWith(
      [
        {
          name: "ai",
          type: "action",
          text: "input '[[value]]' in the input field",
        },
      ],
      { value: "name" },
    );
  });
  it("should support concept behaviors", async () => {
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

    // Mock TextAgent find method
    const mockContext = stepAgent["context"] as any;
    const textAgent = mockContext.getAgents().getTextAgent();
    vi.mocked(textAgent.find).mockResolvedValue({ text: 'the thought "{{value}}" is shown', args: { value: "name" } });

    await stepAgent.start();
    await stepAgent.executeStep("it should show the thought 'name'");
    expect(actionAgent.executeActions).toHaveBeenCalledWith(
      [
        {
          name: "MainPage",
          type: "action",
          text: "Check it shows '[[value]]' in the input field",
        },
      ],
      { value: "name" },
    );
  }, 300000);
});
