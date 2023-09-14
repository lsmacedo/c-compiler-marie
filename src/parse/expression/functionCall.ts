import { parseValue } from "..";
import { FunctionCall } from "../../types";

// Parser for function call parameters
const parseFunctionCallParameters = (
  params: string
): FunctionCall["params"] => {
  if (!params) {
    return [];
  }
  // Following regex is not yet bullet-proof and might fail
  const splitRegex = /(?<!.+?\([^)]+),/g;
  return params
    .split(splitRegex)
    .map((param) => parseValue(param.trim()))
    .filter((param) => param);
};

const functionCall = {
  regex: /^\s*(?<name>[^\s]+?)\s*\(\s*(?<params>[^)]+?)?\s*\)\s*;?$/,
  parser: (matches: RegExpMatchArray): FunctionCall => {
    const [_, name, paramsStr] = matches;
    const params = parseFunctionCallParameters(paramsStr);
    return { name, params, paramsStr };
  },
};

export default functionCall;
