import { parseValue } from "..";
import { Return } from "../../types";

const returnExpression = {
  regex: /^\s*return\s*([^;]*?)?\s*;?\s*$/,
  parser: (matches: string[]): Return => {
    const [_, valueString] = matches;
    return { value: valueString ? parseValue(valueString) : undefined };
  },
};

export default returnExpression;
