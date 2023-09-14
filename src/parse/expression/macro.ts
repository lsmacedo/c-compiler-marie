import { parseValue } from "..";
import { Macro, Value } from "../../types";
import { macros } from "../state";

const macro = {
  regex:
    /^\s*#define\s+(?<name>[^\s]+?)(?<params>\([^\)]*?\))?\s+(?<value>.+?)\s*;?\s*$/,
  parser: (matches: string[]): Macro => {
    const [_, name, paramsStr, valueStr] = matches;
    const params =
      paramsStr
        ?.substring(1, paramsStr.length - 1)
        .split(",")
        .map((p) => p.trim()) ?? undefined;
    // Set value string if macro is object-like and a valid value
    let value: string | undefined;
    try {
      if (!params) {
        parseValue(valueStr);
        value = valueStr;
      }
    } catch (err) {}
    // Set expressions string otherwise
    const expressions = !value ? valueStr : undefined;

    const parsed = {
      name,
      params,
      value,
      expressions,
    };
    macros.push(parsed);
    return parsed;
  },
};

export default macro;
