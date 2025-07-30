import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "dotenv/config";
import { ChatCompletionMessageToolCall, ChatCompletionMessage } from "openai/resources/chat/completions/completions";
import { BrowserAgent } from "../src/browser-agent";
import { ToolExecutor } from "../src/llm/tool-executor";
import { LLM } from "../src/llm/openai";
import { mockContext } from "./utils";

describe("BrowserAgent with ToolExecutor", () => {
  let agent: BrowserAgent;
  let context: ReturnType<typeof mockContext>;
  let toolExecutor: ToolExecutor;
  let mockLLM: ReturnType<typeof vi.mocked<LLM>>;

  beforeEach(async () => {
    context = mockContext();
    mockLLM = vi.mocked(context.getLLM());

    // Create a real ToolExecutor with mocked LLM and cache
    toolExecutor = new ToolExecutor(context.getLLM(), context.getCache());

    // Override getToolExecutor to return our real ToolExecutor
    vi.mocked(context.getToolExecutor).mockReturnValue(toolExecutor);

    agent = new BrowserAgent(context);
    await agent.start();
  });

  afterEach(async () => {
    await agent.stop();
  });

  describe("open tool", () => {
    it("should open URL when LLM calls open tool", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_123",
        type: "function",
        function: {
          name: "open",
          arguments: '{"url": "https://example.com"}',
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask
        .mockResolvedValueOnce({
          role: "assistant",
          content: null,
          tool_calls: [mockToolCall],
        } as unknown as ChatCompletionMessage)
        .mockResolvedValueOnce({
          role: "assistant",
          content: '{"success": true, "result": {"message": "URL opened successfully"}}',
        } as unknown as ChatCompletionMessage);

      const result = await agent.ask("Open https://example.com");

      expect(context.getDriver().open).toHaveBeenCalledWith("https://example.com");
      expect(result.success).toBe(true);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("saveScreenshot tool", () => {
    it("should save screenshot when LLM calls saveScreenshot tool", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_456",
        type: "function",
        function: {
          name: "saveScreenshot",
          arguments: '{"name": "test-screenshot"}',
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask
        .mockResolvedValueOnce({
          role: "assistant",
          content: null,
          tool_calls: [mockToolCall],
        } as unknown as ChatCompletionMessage)
        .mockResolvedValueOnce({
          role: "assistant",
          content: '{"success": true, "result": {"message": "Screenshot saved"}}',
        } as unknown as ChatCompletionMessage);

      const result = await agent.ask("Take a screenshot");

      expect(context.getDriver().saveScreenshot).toHaveBeenCalledWith("test-screenshot");
      expect(result.success).toBe(true);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("saveVideo tool", () => {
    it("should save video when LLM calls saveVideo tool", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_789",
        type: "function",
        function: {
          name: "saveVideo",
          arguments: '{"name": "test-video"}',
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask
        .mockResolvedValueOnce({
          role: "assistant",
          content: null,
          tool_calls: [mockToolCall],
        } as unknown as ChatCompletionMessage)
        .mockResolvedValueOnce({
          role: "assistant",
          content: '{"success": true, "result": {"message": "Video saved"}}',
        } as unknown as ChatCompletionMessage);

      const result = await agent.ask("Save the video");

      expect(context.getDriver().saveVideo).toHaveBeenCalledWith("test-video");
      expect(result.success).toBe(true);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("deleteVideo tool", () => {
    it("should delete video when LLM calls deleteVideo tool", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_999",
        type: "function",
        function: {
          name: "deleteVideo",
          arguments: "{}",
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask
        .mockResolvedValueOnce({
          role: "assistant",
          content: null,
          tool_calls: [mockToolCall],
        } as unknown as ChatCompletionMessage)
        .mockResolvedValueOnce({
          role: "assistant",
          content: '{"success": true, "result": {"message": "Video deleted"}}',
        } as unknown as ChatCompletionMessage);

      const result = await agent.ask("Delete the video");

      expect(context.getDriver().deleteVideo).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("addItemInLocalStorage tool", () => {
    it("should add item to local storage when LLM calls addItemInLocalStorage tool", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_111",
        type: "function",
        function: {
          name: "addItemInLocalStorage",
          arguments: '{"key": "user", "value": "john"}',
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask
        .mockResolvedValueOnce({
          role: "assistant",
          content: null,
          tool_calls: [mockToolCall],
        } as unknown as ChatCompletionMessage)
        .mockResolvedValueOnce({
          role: "assistant",
          content: '{"success": true, "result": {"message": "Item added to local storage"}}',
        } as unknown as ChatCompletionMessage);

      const result = await agent.ask("Add user to local storage");

      expect(context.getDriver().addItemInLocalStorage).toHaveBeenCalledWith("user", "john");
      expect(result.success).toBe(true);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("quit tool", () => {
    it("should quit browser when LLM calls quit tool", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_222",
        type: "function",
        function: {
          name: "quit",
          arguments: "{}",
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask
        .mockResolvedValueOnce({
          role: "assistant",
          content: null,
          tool_calls: [mockToolCall],
        } as unknown as ChatCompletionMessage)
        .mockResolvedValueOnce({
          role: "assistant",
          content: '{"success": true, "result": {"message": "Browser closed"}}',
        } as unknown as ChatCompletionMessage);

      const result = await agent.ask("Close the browser");

      expect(context.getDriver().quit).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("multiple tool calls", () => {
    it("should handle multiple tool calls in sequence", async () => {
      const mockToolCall1: ChatCompletionMessageToolCall = {
        id: "call_333",
        type: "function",
        function: {
          name: "open",
          arguments: '{"url": "https://example.com"}',
        },
      };

      const mockToolCall2: ChatCompletionMessageToolCall = {
        id: "call_444",
        type: "function",
        function: {
          name: "saveScreenshot",
          arguments: '{"name": "homepage"}',
        },
      };

      // Mock LLM to return multiple tool calls
      mockLLM.ask
        .mockResolvedValueOnce({
          role: "assistant",
          content: null,
          tool_calls: [mockToolCall1, mockToolCall2],
        } as unknown as ChatCompletionMessage)
        .mockResolvedValueOnce({
          role: "assistant",
          content: '{"success": true, "result": {"message": "Multiple actions completed"}}',
        } as unknown as ChatCompletionMessage);

      const result = await agent.ask("Open example.com and take a screenshot");

      expect(context.getDriver().open).toHaveBeenCalledWith("https://example.com");
      expect(context.getDriver().saveScreenshot).toHaveBeenCalledWith("homepage");
      expect(result.success).toBe(true);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });
  });

  describe("error handling", () => {
    it("should handle unknown tool function", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_error",
        type: "function",
        function: {
          name: "unknownTool",
          arguments: '{"param": "value"}',
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask.mockResolvedValueOnce({
        role: "assistant",
        content: null,
        tool_calls: [mockToolCall],
      } as unknown as ChatCompletionMessage);

      await expect(agent.ask("Call unknown tool")).rejects.toThrow();
    });

    it("should handle invalid JSON in tool arguments", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_invalid",
        type: "function",
        function: {
          name: "open",
          arguments: "invalid json",
        },
      };

      // Mock LLM to return tool call
      mockLLM.ask.mockResolvedValueOnce({
        role: "assistant",
        content: null,
        tool_calls: [mockToolCall],
      } as unknown as ChatCompletionMessage);

      await expect(agent.ask("Open with invalid args")).rejects.toThrow();
    });
  });

  describe("cache integration", () => {
    it("should use cache when enabled", async () => {
      vi.mocked(context.isCacheEnabled).mockReturnValue(true);
      const mockCache = context.getCache();

      // Mock cache to return cached tool calls
      vi.mocked(mockCache.readCache).mockReturnValue([
        {
          id: "cached_call",
          type: "function",
          function: {
            name: "open",
            arguments: '{"url": "https://cached.com"}',
          },
        } as ChatCompletionMessageToolCall,
      ]);

      const result = await agent.ask("Open cached URL");

      expect(mockCache.readCache).toHaveBeenCalledWith("browser-agent", "Open cached URL");
      expect(context.getDriver().open).toHaveBeenCalledWith("https://cached.com");
      expect(result.success).toBe(true);
      // Should not call LLM when using cache
      expect(mockLLM.ask).not.toHaveBeenCalled();
    });
  });
});
