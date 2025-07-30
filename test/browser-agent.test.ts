import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "dotenv/config";
import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions/completions";
import { BrowserAgent } from "../src/browser-agent";
import { LLM } from "../src/llm/openai";
import { mockContext } from "./utils";

describe("BrowserAgent", () => {
  let agent: BrowserAgent;
  let context: ReturnType<typeof mockContext>;
  let mockLLM: ReturnType<typeof vi.mocked<LLM>>;
  let capturedCallTool: (toolCall: ChatCompletionMessageToolCall) => Promise<string>;

  beforeEach(async () => {
    context = mockContext();
    mockLLM = vi.mocked(context.getLLM());
    agent = new BrowserAgent(context);
    await agent.start();

    // Capture the callTool function by calling ask first
    await agent.ask("test prompt");
    const executeCall = vi.mocked(mockLLM.execute).mock.calls[0];
    capturedCallTool = executeCall[1].callTool as (toolCall: ChatCompletionMessageToolCall) => Promise<string>;
  });

  afterEach(async () => {
    await agent.stop();
  });

  describe("ask method", () => {
    it("should call LLM execute with proper parameters", async () => {
      const prompt = "Open https://example.com";

      await agent.ask(prompt);

      expect(mockLLM.execute).toHaveBeenCalledWith(prompt, {
        callTool: expect.any(Function),
        useCache: false,
        systemPrompt: expect.any(String),
        cacheKey: "browser-agent",
        tools: expect.any(Array),
      });
    });

    it("should pass cache setting from context", async () => {
      vi.mocked(context.isCacheEnabled).mockReturnValue(true);
      const prompt = "Save screenshot test";

      await agent.ask(prompt);

      expect(mockLLM.execute).toHaveBeenCalledWith(prompt, {
        callTool: expect.any(Function),
        useCache: true,
        systemPrompt: expect.any(String),
        cacheKey: "browser-agent",
        tools: expect.any(Array),
      });
    });

    it("should pass custom cache setting when provided", async () => {
      const prompt = "Delete video";

      await agent.ask(prompt, { useCache: true });

      expect(mockLLM.execute).toHaveBeenCalledWith(prompt, {
        callTool: expect.any(Function),
        useCache: true,
        systemPrompt: expect.any(String),
        cacheKey: "browser-agent",
        tools: expect.any(Array),
      });
    });
  });

  describe("callTool lambda", () => {
    it("should call the correct tool function with parsed arguments", async () => {
      const mockToolCall = {
        id: "call_123",
        type: "function" as const,
        function: {
          name: "open",
          arguments: '{"url": "https://example.com"}',
        },
      };

      await capturedCallTool(mockToolCall);

      expect(context.getDriver().open).toHaveBeenCalledWith("https://example.com");
    });

    it("should handle tool calls with different argument types", async () => {
      const mockToolCall = {
        id: "call_456",
        type: "function" as const,
        function: {
          name: "addItemInLocalStorage",
          arguments: '{"key": "user", "value": "john"}',
        },
      };

      await capturedCallTool(mockToolCall);

      expect(context.getDriver().addItemInLocalStorage).toHaveBeenCalledWith("user", "john");
    });

    it("should return JSON stringified result from tool function", async () => {
      const mockToolCall = {
        id: "call_789",
        type: "function" as const,
        function: {
          name: "saveScreenshot",
          arguments: '{"name": "test-screenshot"}',
        },
      };

      const result = await capturedCallTool(mockToolCall);

      expect(result).toBe('{"action":"saveScreenshot","details":"Screenshot saved as: test-screenshot.png"}');
      expect(context.getDriver().saveScreenshot).toHaveBeenCalledWith("test-screenshot");
    });

    it("should handle tool calls with no arguments", async () => {
      const mockToolCall = {
        id: "call_999",
        type: "function" as const,
        function: {
          name: "quit",
          arguments: "{}",
        },
      };

      const result = await capturedCallTool(mockToolCall);

      expect(result).toBe('{"action":"quit","details":"Browser closed"}');
      expect(context.getDriver().quit).toHaveBeenCalled();
    });

    it("should throw error for unknown tool function", async () => {
      const mockToolCall = {
        id: "call_error",
        type: "function" as const,
        function: {
          name: "unknownTool",
          arguments: '{"param": "value"}',
        },
      };

      await expect(capturedCallTool(mockToolCall)).rejects.toThrow();
    });
  });

  describe("tool setup", () => {
    it("should have correct tool definitions", async () => {
      const executeCall = vi.mocked(mockLLM.execute).mock.calls[0];
      const tools = executeCall[1].tools;

      expect(tools).toHaveLength(6);

      const toolNames = tools.map((tool: { function: { name: string } }) => tool.function.name);
      expect(toolNames).toContain("open");
      expect(toolNames).toContain("saveScreenshot");
      expect(toolNames).toContain("saveVideo");
      expect(toolNames).toContain("deleteVideo");
      expect(toolNames).toContain("addItemInLocalStorage");
      expect(toolNames).toContain("quit");
    });

    it("should have proper tool structure", async () => {
      const executeCall = vi.mocked(mockLLM.execute).mock.calls[0];
      const tools = executeCall[1].tools;

      const openTool = tools.find((tool: { function: { name: string } }) => tool.function.name === "open");
      expect(openTool).toEqual({
        type: "function",
        function: {
          name: "open",
          description: "Open the specified URL",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL to open",
              },
            },
            required: ["url"],
          },
        },
      });
    });
  });
});
