import { parseValue } from "..";
import { Value } from "../../types";

const postfix = {
  regex: /^\s*(?<value>[^\s]+?)\s*(?<operator>\+\+|--|-)\s*;?\s*?$/,
  parser: (matches: RegExpMatchArray): Value => {
    const [_, value, operator] = matches;
    return { postfix: { operator, value: parseValue(value) } };
  },
};

export default postfix;
