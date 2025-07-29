import type { Page } from "playwright";
import { vi } from "vitest";
import { ActionAgent } from "../src/action-agent";
import { BrowserAgent } from "../src/browser-agent";
import { Context } from "../src/context";
import { DataAgent } from "../src/data-agent";
import { Driver } from "../src/drivers/driver";
import { StepAgent } from "../src/step-agent";
import { TextAgent } from "../src/text-agent";
import { UIAgent } from "../src/ui-agent";

/**
 * Creates a mock Context with all public methods mocked
 * @returns A fully mocked Context instance
 */
export function mockContext(): Context {
  // Mock Driver
  const mockDriver = {
    init: vi.fn().mockResolvedValue(undefined),
    open: vi.fn().mockResolvedValue(undefined),
    saveScreenshot: vi.fn().mockResolvedValue(undefined),
    saveVideo: vi.fn().mockResolvedValue(undefined),
    deleteVideo: vi.fn().mockResolvedValue(undefined),
    addItemInLocalStorage: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    page: {} as Page,
  } as unknown as Driver;

  // Mock Agents
  const mockActionAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    executeActions: vi.fn().mockResolvedValue(undefined),
  } as unknown as ActionAgent;

  const mockBrowserAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    ask: vi.fn().mockResolvedValue(""),
  } as unknown as BrowserAgent;

  const mockDataAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    ask: vi.fn().mockResolvedValue(""),
  } as unknown as DataAgent;

  const mockStepAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    executeStep: vi.fn().mockResolvedValue(undefined),
  } as unknown as StepAgent;

  const mockTextAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    find: vi.fn().mockResolvedValue({ text: "", args: {} }),
    ask: vi.fn().mockResolvedValue(""),
  } as unknown as TextAgent;

  const mockUIAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    setDriver: vi.fn().mockResolvedValue(undefined),
    ai: vi.fn().mockResolvedValue(undefined),
    aiTap: vi.fn().mockResolvedValue(undefined),
    aiInput: vi.fn().mockResolvedValue(undefined),
    aiHover: vi.fn().mockResolvedValue(undefined),
    aiWaitFor: vi.fn().mockResolvedValue(undefined),
    aiKeyboardPress: vi.fn().mockResolvedValue(undefined),
    aiAssert: vi.fn().mockResolvedValue(undefined),
  } as unknown as UIAgent;

  // Mock Agents class
  const mockAgents = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    getActionAgent: vi.fn().mockReturnValue(mockActionAgent),
    getBrowserAgent: vi.fn().mockReturnValue(mockBrowserAgent),
    getDataAgent: vi.fn().mockReturnValue(mockDataAgent),
    getStepAgent: vi.fn().mockReturnValue(mockStepAgent),
    getTextAgent: vi.fn().mockReturnValue(mockTextAgent),
    getUIAgent: vi.fn().mockReturnValue(mockUIAgent),
  };

  // Mock Context
  const mockContext = {
    getDriver: vi.fn().mockReturnValue(mockDriver),
    getActionAgent: vi.fn().mockReturnValue(mockActionAgent),
    getBrowserAgent: vi.fn().mockReturnValue(mockBrowserAgent),
    getDataAgent: vi.fn().mockReturnValue(mockDataAgent),
    getStepAgent: vi.fn().mockReturnValue(mockStepAgent),
    getTextAgent: vi.fn().mockReturnValue(mockTextAgent),
    getUIAgent: vi.fn().mockReturnValue(mockUIAgent),
    getOptions: vi.fn().mockReturnValue({}),
    getOption: vi.fn().mockReturnValue(undefined),
    isCacheEnabled: vi.fn().mockReturnValue(false),
    isHeadless: vi.fn().mockReturnValue(false),
    isLoggingEnabled: vi.fn().mockReturnValue(false),
    init: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
  } as unknown as Context;

  return mockContext;
}
