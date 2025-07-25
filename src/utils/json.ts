export function parseJson(text: string): unknown {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON string found in: ${text}`);
  }
  return JSON.parse(jsonMatch[0]);
}
