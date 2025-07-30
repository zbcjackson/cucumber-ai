import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions/completions";
import { Cache } from "../../src/cache";
import { LLM } from "../../src/llm/openai";
import { ToolExecutor, Result } from "../../src/llm/tool-executor";
import { ChatCompletionMessage } from "openai/resources/chat/completions/completions";

describe("ToolExecutor", () => {
  let toolExecutor: ToolExecutor;
  let mockLLM: ReturnType<typeof vi.mocked<LLM>>;
  let mockCache: ReturnType<typeof vi.mocked<Cache>>;

  beforeEach(() => {
    mockLLM = {
      ask: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<LLM>>;

    mockCache = {
      readCache: vi.fn(),
      writeCache: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<Cache>>;

    toolExecutor = new ToolExecutor(mockLLM, mockCache);
  });

  describe("execute", () => {
    it("should execute with basic parameters", async () => {
      const mockMessage = {
        content: '{"success": true, "result": {"key": "value"}}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      const result = await toolExecutor.execute("test prompt", {
        callTool: vi.fn(),
        tools: [],
        systemPrompt: "test system",
        useCache: false,
        cacheKey: "test-key",
      });

      expect(result).toEqual({ success: true, result: { key: "value" } });
      expect(mockLLM.ask).toHaveBeenCalled();
    });

    it("should use default parameters when not provided", async () => {
      const mockMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      const result = await toolExecutor.execute("test prompt", {
        callTool: vi.fn(),
        tools: [],
      });

      expect(result).toEqual({ success: true });
      expect(mockLLM.ask).toHaveBeenCalled();
    });

    it("should handle tool calls in response", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_123",
        type: "function",
        function: {
          name: "testTool",
          arguments: '{"param": "value"}',
        },
      };

      const firstMessage = {
        content: null,
        role: "assistant" as const,
        tool_calls: [mockToolCall],
      } as unknown as ChatCompletionMessage;

      const secondMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValueOnce(firstMessage).mockResolvedValueOnce(secondMessage);

      const mockCallTool = vi.fn().mockResolvedValue("tool result");

      const result = await toolExecutor.execute("test prompt", {
        callTool: mockCallTool,
        tools: [],
      });

      expect(result).toEqual({ success: true });
      expect(mockCallTool).toHaveBeenCalledWith(mockToolCall);
      expect(mockLLM.ask).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple tool calls", async () => {
      const mockToolCall1: ChatCompletionMessageToolCall = {
        id: "call_1",
        type: "function",
        function: {
          name: "tool1",
          arguments: '{"param": "value1"}',
        },
      };

      const mockToolCall2: ChatCompletionMessageToolCall = {
        id: "call_2",
        type: "function",
        function: {
          name: "tool2",
          arguments: '{"param": "value2"}',
        },
      };

      const firstMessage = {
        content: null,
        role: "assistant" as const,
        tool_calls: [mockToolCall1, mockToolCall2],
      } as unknown as ChatCompletionMessage;

      const secondMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValueOnce(firstMessage).mockResolvedValueOnce(secondMessage);

      const mockCallTool = vi.fn().mockResolvedValue("tool result");

      const result = await toolExecutor.execute("test prompt", {
        callTool: mockCallTool,
        tools: [],
      });

      expect(result).toEqual({ success: true });
      expect(mockCallTool).toHaveBeenCalledTimes(2);
      expect(mockCallTool).toHaveBeenCalledWith(mockToolCall1);
      expect(mockCallTool).toHaveBeenCalledWith(mockToolCall2);
    });

    it("should throw error when result is not successful", async () => {
      const mockMessage = {
        content: '{"success": false, "error": "test error"}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      await expect(
        toolExecutor.execute("test prompt", {
          callTool: vi.fn(),
          tools: [],
        }),
      ).rejects.toThrow("Action failed: test prompt");
    });

    it("should cache tool calls when successful and no result", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_123",
        type: "function",
        function: {
          name: "testTool",
          arguments: '{"param": "value"}',
        },
      };

      const firstMessage = {
        content: null,
        role: "assistant" as const,
        tool_calls: [mockToolCall],
      } as unknown as ChatCompletionMessage;

      const secondMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValueOnce(firstMessage).mockResolvedValueOnce(secondMessage);

      const mockCallTool = vi.fn().mockResolvedValue("tool result");

      await toolExecutor.execute("test prompt", {
        callTool: mockCallTool,
        tools: [],
        cacheKey: "test-cache",
      });

      expect(mockCache.writeCache).toHaveBeenCalledWith("test-cache", "test prompt", [mockToolCall]);
    });

    it("should not cache when result has content", async () => {
      const mockMessage = {
        content: '{"success": true, "result": {"key": "value"}}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      await toolExecutor.execute("test prompt", {
        callTool: vi.fn(),
        tools: [],
      });

      expect(mockCache.writeCache).not.toHaveBeenCalled();
    });
  });

  describe("caching", () => {
    it("should use cached tool calls when available", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_123",
        type: "function",
        function: {
          name: "testTool",
          arguments: '{"param": "value"}',
        },
      };

      vi.mocked(mockCache.readCache).mockReturnValue([mockToolCall]);

      const mockCallTool = vi.fn().mockResolvedValue("tool result");

      const result = await toolExecutor.execute("test prompt", {
        callTool: mockCallTool,
        tools: [],
        useCache: true,
        cacheKey: "test-cache",
      });

      expect(result).toEqual({ success: true });
      expect(mockCache.readCache).toHaveBeenCalledWith("test-cache", "test prompt");
      expect(mockCallTool).toHaveBeenCalledWith(mockToolCall);
      expect(mockLLM.ask).not.toHaveBeenCalled();
    });

    it("should not use cache when disabled", async () => {
      const mockMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);
      vi.mocked(mockCache.readCache).mockReturnValue([]);

      const result = await toolExecutor.execute("test prompt", {
        callTool: vi.fn(),
        tools: [],
        useCache: false,
        cacheKey: "test-cache",
      });

      expect(result).toEqual({ success: true });
      expect(mockCache.readCache).not.toHaveBeenCalled();
      expect(mockLLM.ask).toHaveBeenCalled();
    });

    it("should handle empty cache gracefully", async () => {
      vi.mocked(mockCache.readCache).mockReturnValue(null);

      const mockMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      const result = await toolExecutor.execute("test prompt", {
        callTool: vi.fn(),
        tools: [],
        useCache: true,
        cacheKey: "test-cache",
      });

      expect(result).toEqual({ success: true });
      expect(mockLLM.ask).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle JSON parsing errors", async () => {
      const mockMessage = {
        content: "invalid json",
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      await expect(
        toolExecutor.execute("test prompt", {
          callTool: vi.fn(),
          tools: [],
        }),
      ).rejects.toThrow();
    });

    it("should handle tool call errors", async () => {
      const mockToolCall: ChatCompletionMessageToolCall = {
        id: "call_123",
        type: "function",
        function: {
          name: "testTool",
          arguments: '{"param": "value"}',
        },
      };

      const firstMessage = {
        content: null,
        role: "assistant" as const,
        tool_calls: [mockToolCall],
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(firstMessage);

      const mockCallTool = vi.fn().mockRejectedValue(new Error("Tool execution failed"));

      await expect(
        toolExecutor.execute("test prompt", {
          callTool: mockCallTool,
          tools: [],
        }),
      ).rejects.toThrow("Tool execution failed");
    });

    it("should handle LLM ask errors", async () => {
      vi.mocked(mockLLM.ask).mockRejectedValue(new Error("LLM error"));

      await expect(
        toolExecutor.execute("test prompt", {
          callTool: vi.fn(),
          tools: [],
        }),
      ).rejects.toThrow("LLM error");
    });
  });

  describe("timing", () => {
    it("should log elapsed time", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const mockMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      await toolExecutor.execute("test prompt", {
        callTool: vi.fn(),
        tools: [],
      });

      expect(consoleSpy).toHaveBeenCalledWith("Agent task elapsed time: 0s");

      consoleSpy.mockRestore();
    });
  });

  describe("complex scenarios", () => {
    it("should handle multiple rounds of tool calls", async () => {
      const mockToolCall1: ChatCompletionMessageToolCall = {
        id: "call_1",
        type: "function",
        function: {
          name: "tool1",
          arguments: '{"param": "value1"}',
        },
      };

      const mockToolCall2: ChatCompletionMessageToolCall = {
        id: "call_2",
        type: "function",
        function: {
          name: "tool2",
          arguments: '{"param": "value2"}',
        },
      };

      const firstMessage = {
        content: null,
        role: "assistant" as const,
        tool_calls: [mockToolCall1],
      } as unknown as ChatCompletionMessage;

      const secondMessage = {
        content: null,
        role: "assistant" as const,
        tool_calls: [mockToolCall2],
      } as unknown as ChatCompletionMessage;

      const finalMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask)
        .mockResolvedValueOnce(firstMessage)
        .mockResolvedValueOnce(secondMessage)
        .mockResolvedValueOnce(finalMessage);

      const mockCallTool = vi.fn().mockResolvedValue("tool result");

      const result = await toolExecutor.execute("test prompt", {
        callTool: mockCallTool,
        tools: [],
      });

      expect(result).toEqual({ success: true });
      expect(mockCallTool).toHaveBeenCalledTimes(2);
      expect(mockLLM.ask).toHaveBeenCalledTimes(3);
    });

    it("should handle tools parameter correctly", async () => {
      const mockTools = [
        {
          type: "function" as const,
          function: {
            name: "testTool",
            description: "A test tool",
            parameters: {
              type: "object",
              properties: {
                param: { type: "string" },
              },
            },
          },
        },
      ];

      const mockMessage = {
        content: '{"success": true}',
        role: "assistant" as const,
      } as unknown as ChatCompletionMessage;

      vi.mocked(mockLLM.ask).mockResolvedValue(mockMessage);

      await toolExecutor.execute("test prompt", {
        callTool: vi.fn(),
        tools: mockTools,
      });

      expect(mockLLM.ask).toHaveBeenCalled();
    });
  });
});
