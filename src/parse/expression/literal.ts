import { Value } from "../../types";

const literal = {
  regex: /^\s*(?:(?<int>[0-9]+)|'(?<char>[^']{1,3}|\\[^'])')\s*;?\s*$/,
  parser: (matches: string[]): Value => {
    const [_, int, char] = matches;
    if (int !== undefined || char !== undefined) {
      return {
        literal:
          int !== undefined
            ? Number(int)
            : JSON.parse(`"${char}"`).charCodeAt(0),
      };
    }
    throw new Error("Error parsing literal");
  },
};

export default literal;
