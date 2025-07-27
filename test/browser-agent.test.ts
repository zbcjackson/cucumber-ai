import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import "dotenv/config";
import { BrowserAgent } from "../src/browser-agent";
import { Driver } from "../src/drivers/driver";

describe("BrowserAgent", () => {
  let mockDriver: Driver;
  let agent: BrowserAgent;

  beforeEach(async () => {
    mockDriver = {
      open: vi.fn(),
      saveScreenshot: vi.fn(),
      saveVideo: vi.fn(),
      deleteVideo: vi.fn(),
      addItemInLocalStorage: vi.fn(),
      quit: vi.fn(),
    } as unknown as Driver;

    agent = new BrowserAgent(mockDriver, { useCache: false });
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
      expect(mockDriver.open).toHaveBeenCalledWith("https://example.com");
    });

    it("should handle open operation with different URLs", async () => {
      const result = await agent.ask("Open https://google.com");

      expect(result.success).toBe(true);
      expect(mockDriver.open).toHaveBeenCalledWith("https://google.com");
    });
  });

  describe("ask - screenshot operation", () => {
    it("should save screenshot successfully", async () => {
      const result = await agent.ask("Save a screenshot with filename test-screenshot");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(mockDriver.saveScreenshot).toHaveBeenCalledWith("test-screenshot");
    });

    it("should handle screenshot with different filenames", async () => {
      const result = await agent.ask("Save a screenshot with filename my-page");

      expect(result.success).toBe(true);
      expect(mockDriver.saveScreenshot).toHaveBeenCalledWith("my-page");
    });
  });

  describe("ask - video operations", () => {
    it("should save video successfully", async () => {
      const result = await agent.ask("Save the recorded video with filename test-session");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(mockDriver.saveVideo).toHaveBeenCalledWith("test-session");
    });

    it("should delete video successfully", async () => {
      const result = await agent.ask("Delete the recorded video");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(mockDriver.deleteVideo).toHaveBeenCalled();
    });
  });

  describe("ask - local storage operations", () => {
    it("should add item to local storage successfully", async () => {
      const result = await agent.ask("Add a key-value pair to local storage with key 'user' and value 'john'");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(mockDriver.addItemInLocalStorage).toHaveBeenCalledWith("user", "john");
    });

    it("should handle different key-value pairs", async () => {
      const result = await agent.ask("Add a key-value pair to local storage with key 'theme' and value 'dark'");

      expect(result.success).toBe(true);
      expect(mockDriver.addItemInLocalStorage).toHaveBeenCalledWith("theme", "dark");
    });
  });

  describe("ask - quit operation", () => {
    it("should quit browser successfully", async () => {
      const result = await agent.ask("Close the browser");

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
      expect(mockDriver.quit).toHaveBeenCalled();
    });
  });
});
