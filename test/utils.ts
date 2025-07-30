import type { Page } from "playwright";
import { vi } from "vitest";
import { ActionAgent, ConceptAgent } from "../src/action-agent";
import { Actions } from "../src/action-agent/actions";
import { BrowserAgent } from "../src/browser-agent";
import { Context } from "../src/context";
import { DataAgent } from "../src/data-agent";
import { Driver } from "../src/drivers/driver";
import { LLM } from "../src/llm/openai";
import { ToolExecutor } from "../src/llm/tool-executor";
import { StepAgent } from "../src/step-agent";
import { TextAgent } from "../src/text-agent";
import { UIAgent } from "../src/ui-agent";

/**
 * Creates a mock Driver
 * @returns A mocked Driver instance
 */
export function mockDriver(): Driver {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(undefined),
    saveScreenshot: vi.fn().mockResolvedValue(undefined),
    saveVideo: vi.fn().mockResolvedValue(undefined),
    deleteVideo: vi.fn().mockResolvedValue(undefined),
    addItemInLocalStorage: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    page: {} as Page,
  } as unknown as Driver;
}

/**
 * Creates a mock LLM
 * @returns A mocked LLM instance
 */
export function mockLLM(): LLM {
  return {
    ask: vi.fn().mockResolvedValue({ content: "mock response" }),
  } as unknown as LLM;
}

/**
 * Creates a mock ToolExecutor
 * @returns A mocked ToolExecutor instance
 */
export function mockToolExecutor(): ToolExecutor {
  return {
    execute: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as ToolExecutor;
}

/**
 * Creates a mock ActionAgent
 * @returns A mocked ActionAgent instance
 */
export function mockActionAgent(): ActionAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    executeActions: vi.fn().mockResolvedValue(undefined),
  } as unknown as ActionAgent;
}

/**
 * Creates a mock BrowserAgent
 * @returns A mocked BrowserAgent instance
 */
export function mockBrowserAgent(): BrowserAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    ask: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as BrowserAgent;
}

/**
 * Creates a mock DataAgent
 * @returns A mocked DataAgent instance
 */
export function mockDataAgent(): DataAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    ask: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as DataAgent;
}

/**
 * Creates a mock StepAgent
 * @returns A mocked StepAgent instance
 */
export function mockStepAgent(): StepAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    executeStep: vi.fn().mockResolvedValue(undefined),
  } as unknown as StepAgent;
}

/**
 * Creates a mock ConceptAgent
 * @returns A mocked ConceptAgent instance
 */
export function mockConceptAgent(): ConceptAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    executeBehavior: vi.fn().mockResolvedValue(undefined),
    registerActions: vi.fn().mockReturnValue(undefined),
    unregisterActions: vi.fn().mockReturnValue(undefined),
  } as unknown as ConceptAgent;
}

/**
 * Creates a mock TextAgent
 * @returns A mocked TextAgent instance
 */
export function mockTextAgent(): TextAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    find: vi.fn().mockResolvedValue({ text: "", args: {} }),
    ask: vi.fn().mockResolvedValue(""),
  } as unknown as TextAgent;
}

/**
 * Creates a mock UIAgent
 * @returns A mocked UIAgent instance
 */
export function mockUIAgent(): UIAgent {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    setDriver: vi.fn().mockResolvedValue(undefined),
    ai: vi.fn().mockResolvedValue({ success: true }),
    aiTap: vi.fn().mockResolvedValue({ success: true }),
    aiInput: vi.fn().mockResolvedValue({ success: true }),
    aiHover: vi.fn().mockResolvedValue({ success: true }),
    aiWaitFor: vi.fn().mockResolvedValue({ success: true }),
    aiKeyboardPress: vi.fn().mockResolvedValue({ success: true }),
    aiAssert: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as UIAgent;
}

/**
 * Creates a mock Cache
 * @returns A mocked Cache instance
 */
export function mockCache() {
  return {
    readCache: vi.fn().mockReturnValue(null),
    writeCache: vi.fn().mockReturnValue(undefined),
  };
}

/**
 * Creates a mock Context with all public methods mocked
 * @returns A fully mocked Context instance
 */
export function mockContext(): Context {
  const mockContext = {
    getDriver: vi.fn().mockReturnValue(mockDriver()),
    getLLM: vi.fn().mockReturnValue(mockLLM()),
    getToolExecutor: vi.fn().mockReturnValue(mockToolExecutor()),
    getActions: vi.fn().mockReturnValue(new Actions()),
    getActionAgent: vi.fn().mockReturnValue(mockActionAgent()),
    getBrowserAgent: vi.fn().mockReturnValue(mockBrowserAgent()),
    getConceptAgent: vi.fn().mockReturnValue(mockConceptAgent()),
    getDataAgent: vi.fn().mockReturnValue(mockDataAgent()),
    getStepAgent: vi.fn().mockReturnValue(mockStepAgent()),
    getTextAgent: vi.fn().mockReturnValue(mockTextAgent()),
    getUIAgent: vi.fn().mockReturnValue(mockUIAgent()),
    getCache: vi.fn().mockReturnValue(mockCache()),
    getOptions: vi.fn().mockReturnValue({}),
    getOption: vi.fn().mockReturnValue(undefined),
    isCacheEnabled: vi.fn().mockReturnValue(false),
    isHeadless: vi.fn().mockReturnValue(false),
    isLoggingEnabled: vi.fn().mockReturnValue(false),
    init: vi.fn(),
    quit: vi.fn(),
  } as unknown as Context;

  return mockContext;
}
