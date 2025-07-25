import { describe, expect, it } from "vitest";
import { parseJson } from "../../src/utils/json";

describe("parseJson", () => {
  it("parses a valid JSON string", () => {
    const input = 'Some text {"foo": "bar", "baz": 123} more text';
    expect(parseJson(input)).toEqual({ foo: "bar", baz: 123 });
  });

  it("throws if no JSON is found", () => {
    const input = "No JSON here!";
    expect(() => parseJson(input)).toThrow("No JSON string found");
  });

  it("throws if JSON is malformed", () => {
    const input = 'Text {"foo": "bar", }';
    expect(() => parseJson(input)).toThrow();
  });

  it("parses nested JSON objects", () => {
    const input = 'Start {"outer": {"inner": [1,2,3]}} End';
    expect(parseJson(input)).toEqual({ outer: { inner: [1, 2, 3] } });
  });
});
