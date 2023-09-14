import { TypeDefinition } from "../../types";
import { typedefs } from "../state";

const typedef = {
  regex: /^\s*typedef\s+(?<type>.+?)\s+(?<alias>[^\s]+?)\s*;?\s*$/,
  parser: (matches: string[]): TypeDefinition => {
    const [_, originalType, alias] = matches;
    const parsed = { originalType, alias };
    typedefs.push(parsed);
    return parsed;
  },
};

export default typedef;
