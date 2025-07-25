import { describe, expect, it, vi } from "vitest";
import { Driver } from "../src";
import { UIAgent } from "../src/ui-agent";

vi.mock("@midscene/web");

describe("UI Agent", () => {
  it("could not set driver if started", () => {
    const driver = {} as Driver;
    const uiAgent = new UIAgent(driver);
    uiAgent.start();
    expect(() => uiAgent.setDriver({} as Driver)).toThrow("UI Agent has already started, cannot set driver.");
  });
});
