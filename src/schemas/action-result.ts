import { z } from "zod";

/**
 * Schema for ActionResult based on the Result interface from tool-executor.ts
 * and data-agent system prompt specifications.
 *
 * Represents the result of executing an action with:
 * - success: boolean indicating if all tasks completed successfully (true) or if there were issues (false)
 * - error: optional string containing error message when success is false
 * - result: optional object containing query results with camel case keys when user queries for data
 *
 * Example successful query: { success: true, result: { count: 1 } }
 * Example error: { success: false, error: "Database connection failed" }
 * Example successful action without result: { success: true }
 */
export const ActionResultSchema = z.object({
  success: z.boolean().describe("True if all tasks are successful, false if there are any issues"),
  error: z.string().optional().describe("Error message when success is false"),
  result: z
    .record(z.string(), z.string())
    .optional()
    .describe("Query results with camel case keys when user queries for data"),
});

export type ActionResult = z.infer<typeof ActionResultSchema>;
