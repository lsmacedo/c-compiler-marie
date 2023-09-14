import { parseValue } from "..";
import { Value } from "../../types";

const prefix = {
  regex: /^\s*(?<operator>\+\+|--|-|&|\*)\s*(?<value>[^\s]+?)\s*;?\s*?$/,
  parser: (matches: RegExpMatchArray): Value => {
    const [_, operator, value] = matches;
    return { prefix: { operator, value: parseValue(value) } };
  },
};

export default prefix;
