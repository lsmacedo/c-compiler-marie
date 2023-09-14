import { parseValue } from "..";
import { Value } from "../../types";

const array = {
  regex: /^\s*\[(?<array>[^\]]+)]\s*;?\s*$|^\s*"(?<string>[^"]*)"\s*;?\s*$/,
  parser: (matches: string[]): Value => {
    const [_, array, string] = matches;
    const elements = array
      ? array.split(",").map((value) => parseValue(value))
      : [...string.split(""), "\0"].map((char) => ({
          literal: char.charCodeAt(0),
        }));
    return { elements };
  },
};

export default array;
