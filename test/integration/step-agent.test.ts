import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepAgent } from "../../src";
import "dotenv/config";
import * as StepLoader from "../../src/loaders/step-loader";
import { Runner } from "../../src/runner";

vi.mock("../../src/loaders/step-loader");

describe("Step Agent", () => {
  let stepAgent: StepAgent;
  let runner: Runner;
  beforeEach(() => {
    runner = {
      start: vi.fn(),
      executeActions: vi.fn(),
    } as unknown as Runner;
    stepAgent = new StepAgent(runner);
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
    await stepAgent.start();
    await stepAgent.executeStep("add");
    expect(runner.executeActions).toHaveBeenCalledWith(
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
    await stepAgent.start();
    await stepAgent.executeStep("add 'name'");
    expect(runner.executeActions).toHaveBeenCalledWith(
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
    await stepAgent.start();
    await stepAgent.executeStep("add 'name'");
    expect(runner.executeActions).toHaveBeenCalledWith(
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
    await stepAgent.start();
    await stepAgent.executeStep("it should show the thought 'name'");
    expect(runner.executeActions).toHaveBeenCalledWith(
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
    await stepAgent.start();
    await stepAgent.executeStep("it should show the thought 'name'");
    expect(runner.executeActions).toHaveBeenCalledWith(
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
