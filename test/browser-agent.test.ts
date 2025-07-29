import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "dotenv/config";
import { BrowserAgent } from "../src/browser-agent";
import { Driver } from "../src/drivers/driver";
import { mockContext } from "./utils";

describe("BrowserAgent", () => {
  let driver: Driver;
  let agent: BrowserAgent;
  let context: ReturnType<typeof mockContext>;

  beforeEach(async () => {
    context = mockContext();
    driver = context.getDriver();
    agent = new BrowserAgent(context);
    await agent.start();
  });

  afterEach(async () => {
    await agent.stop();
  });

  describe("ask - open operation", () => {
    it("should open a URL successfully", async () => {
      const result = await agent.ask("Open https://example.com");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(driver.open).toHaveBeenCalledWith("https://example.com");
    });

    it("should handle open operation with different URLs", async () => {
      const result = await agent.ask("Open https://google.com");

      expect(result.success).toBe(true);
      expect(driver.open).toHaveBeenCalledWith("https://google.com");
    });
  });

  describe("ask - screenshot operation", () => {
    it("should save screenshot successfully", async () => {
      const result = await agent.ask("Save a screenshot with filename test-screenshot");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(driver.saveScreenshot).toHaveBeenCalledWith("test-screenshot");
    });
  });

  describe("ask - video operations", () => {
    it("should save video successfully", async () => {
      const result = await agent.ask("Save the recorded video with filename test-session");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(driver.saveVideo).toHaveBeenCalledWith("test-session");
    });

    it("should delete video successfully", async () => {
      const result = await agent.ask("Delete the recorded video");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(driver.deleteVideo).toHaveBeenCalled();
    });
  });

  describe("ask - local storage operations", () => {
    it("should add item to local storage successfully", async () => {
      const result = await agent.ask("Add a key-value pair to local storage with key 'user' and value 'john'");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(driver.addItemInLocalStorage).toHaveBeenCalledWith("user", "john");
    });

    it("should handle different key-value pairs", async () => {
      const result = await agent.ask("Add a key-value pair to local storage with key 'theme' and value 'dark'");

      expect(result.success).toBe(true);
      expect(driver.addItemInLocalStorage).toHaveBeenCalledWith("theme", "dark");
    });
  });

  describe("ask - quit operation", () => {
    it("should quit browser successfully", async () => {
      const result = await agent.ask("Close the browser");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(driver.quit).toHaveBeenCalled();
    });
  });
});
