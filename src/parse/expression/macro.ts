import { parseValue } from "..";
import { Macro } from "../../types";
import { macros } from "../state";

const macro = {
  regex:
    /^\s*#define\s+(?<name>[^\s]+?)(?<params>\([^\)]*?\))?\s+(?<value>.+?)\s*;?\s*$/,
  parser: (matches: string[]): Macro => {
    const [_, name, paramsStr, value] = matches;
    const params =
      paramsStr
        ?.substring(1, paramsStr.length - 1)
        .split(",")
        .map((p) => p.trim()) ?? undefined;
    const parsed = {
      name,
      params,
      value: parseValue(value),
    };
    macros.push(parsed);
    return parsed;
  },
};

export default macro;
