import { describe, expect, it } from "vitest";
import { db } from "../src/data-agent";
import "dotenv/config";

describe.skip("data agent", () => {
  it("should execute query", async () => {
    const result = await db("SELECT 1 + 1 AS result");
    expect(result).toEqual({ success: true, result: { result: 2 } });
  });
  it(
    "api invocation",
    async () => {
      const result = await db("get verification code from the last mail to zbcjackson@proton.me");
      expect(result).toEqual({ success: true, result: { verificationCode: "USEXRQ" } });
    },
    { timeout: 10000 },
  );
  it(
    "cookies should be set",
    async () => {
      await db("send verification code mail to zbcjackson@proton.me");
      const {
        result: { verificationCode: code },
      } = await db("get verification code from the last mail to zbcjackson@proton.me");
      let result = await db(`login with email zbcjackson@proton.me and verification code ${code}`);
      expect(result.success).toBeTruthy();

      result = await db("complete user info with nick name Jackson");
      expect(result.success).toBeTruthy();
      result = await db(`create team with name "My Team", indicator name "Revenue", indicator value 1000`);
      expect(result.success).toBeTruthy();
    },
    { timeout: 100000 },
  );
});
