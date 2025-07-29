import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataAgent } from "../src/data-agent";
import "dotenv/config";
import { mockContext } from "./utils";

describe.skip("data agent", () => {
  let dataAgent: DataAgent;
  let context: ReturnType<typeof mockContext>;

  beforeEach(() => {
    context = mockContext();
    dataAgent = new DataAgent(context);
  });
  it("should execute query", async () => {
    const result = await dataAgent.ask("SELECT 1 + 1 AS result");
    expect(result).toEqual({ success: true, result: { result: 2 } });
  });
  it(
    "api invocation",
    async () => {
      const result = await dataAgent.ask("get verification code from the last mail to zbcjackson@proton.me");
      expect(result).toEqual({ success: true, result: { verificationCode: "USEXRQ" } });
    },
    { timeout: 10000 },
  );
  it(
    "cookies should be set",
    async () => {
      await dataAgent.ask("send verification code mail to zbcjackson@proton.me");
      const {
        result: { verificationCode: code },
      } = await dataAgent.ask("get verification code from the last mail to zbcjackson@proton.me");
      let result = await dataAgent.ask(`login with email zbcjackson@proton.me and verification code ${code}`);
      expect(result.success).toBeTruthy();

      result = await dataAgent.ask("complete user info with nick name Jackson");
      expect(result.success).toBeTruthy();
      result = await dataAgent.ask(`create team with name "My Team", indicator name "Revenue", indicator value 1000`);
      expect(result.success).toBeTruthy();
    },
    { timeout: 100000 },
  );
});
