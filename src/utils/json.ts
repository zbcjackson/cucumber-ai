export function parseJson<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*}/);
  if (!jsonMatch) {
    throw new Error(`No JSON string found in: ${text}`);
  }
  return JSON.parse(jsonMatch[0]) as T;
}
