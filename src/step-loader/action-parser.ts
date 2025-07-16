export interface Action {
  type: "action";
  name: string;
  arg?: string;
  text: string;
}

export function parseAction(trimmed: string) {
  const delimiterIndex = trimmed.indexOf(":");
  let name = trimmed.slice(0, delimiterIndex).trim();
  if (delimiterIndex === -1 || name === "") {
    throw new Error(`Invalid action format in line: "${trimmed}"`);
  }
  const match = name.match(/^(.+)\((.*)\)$/);
  let arg: string;
  if (match) {
    name = match[1].trim();
    arg = match[2].trim();
  }
  const text = trimmed.slice(delimiterIndex + 1).trim();
  if (text === "") {
    throw new Error(`Invalid action format in line: "${trimmed}"`);
  }
  const action: Action = {
    type: "action",
    name,
    arg,
    text,
  };
  return action;
}
