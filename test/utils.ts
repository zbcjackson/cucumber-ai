import type { Page } from "playwright";
import { vi } from "vitest";
import { ActionAgent, ConceptAgent } from "../src/action-agent";
import { BrowserAgent } from "../src/browser-agent";
import { Context } from "../src/context";
import { DataAgent } from "../src/data-agent";
import { Driver } from "../src/drivers/driver";
import { StepAgent } from "../src/step-agent";
import { TextAgent } from "../src/text-agent";
import { UIAgent } from "../src/ui-agent";
import { Actions } from "../src/action-agent/actions";

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
    ask: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as BrowserAgent;

  const mockDataAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    ask: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as DataAgent;

  const mockStepAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    executeStep: vi.fn().mockResolvedValue(undefined),
  } as unknown as StepAgent;

  const mockConceptAgent = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    executeBehavior: vi.fn().mockResolvedValue(undefined),
    registerActions: vi.fn().mockReturnValue(undefined),
    unregisterActions: vi.fn().mockReturnValue(undefined),
  } as unknown as ConceptAgent;

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
    ai: vi.fn().mockResolvedValue({ success: true }),
    aiTap: vi.fn().mockResolvedValue({ success: true }),
    aiInput: vi.fn().mockResolvedValue({ success: true }),
    aiHover: vi.fn().mockResolvedValue({ success: true }),
    aiWaitFor: vi.fn().mockResolvedValue({ success: true }),
    aiKeyboardPress: vi.fn().mockResolvedValue({ success: true }),
    aiAssert: vi.fn().mockResolvedValue({ success: true }),
  } as unknown as UIAgent;

  const mockContext = {
    getDriver: vi.fn().mockReturnValue(mockDriver),
    getActions: vi.fn().mockReturnValue(new Actions()),
    getActionAgent: vi.fn().mockReturnValue(mockActionAgent),
    getBrowserAgent: vi.fn().mockReturnValue(mockBrowserAgent),
    getConceptAgent: vi.fn().mockReturnValue(mockConceptAgent),
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
