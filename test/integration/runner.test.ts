import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UIAgent } from "../../src/ui-agent";
import "dotenv/config";
import { Driver } from "../../src";
import { DataAgent } from "../../src/data-agent";
import * as ConceptLoader from "../../src/loaders/concept-loader";
import { Runner } from "../../src/runner";

vi.mock("../../src/loaders/concept-loader");

describe("Runner", () => {
  let uiAgent: UIAgent;
  let dataAgent: DataAgent;
  let driver: Driver;
  let runner: Runner;
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
    runner = new Runner(driver);
    runner.setDataAgent(dataAgent);
    runner.setUIAgent(uiAgent);
    vi.mocked(ConceptLoader.loadConcepts).mockReturnValue([]);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("should execute defined steps", async () => {
    await runner.start();
    await runner.executeActions([
      {
        name: "ai",
        type: "action",
        text: "click add button",
      },
    ]);
    expect(uiAgent.ai).toHaveBeenCalledWith("click add button");
  });
  it("should execute defined step with parameter", async () => {
    await runner.start();
    await runner.executeActions(
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
    await runner.start();
    await runner.executeActions(
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
    await runner.start();
    await runner.executeActions(
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
    await runner.start();
    await runner.executeActions(
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
