/**
 * Common interface for all agent classes
 */
export interface Agent {
  /**
   * Start the agent and initialize any required resources
   */
  start(): Promise<void>;

  /**
   * Stop the agent and clean up any resources
   */
  stop(): Promise<void>;
}
