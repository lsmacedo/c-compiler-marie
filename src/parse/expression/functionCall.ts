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
    // Macro
    // const macro = macros.find((macro) => macro.name === name);
    // if (macro?.params) {
    //   let str = macro.expressionsString;
    //   const iterator = str.matchAll(
    //     /(?<b>".*?")|(?<a>[^\s+\-\*/%=<>&;,{}()"]+)/g
    //   );
    //   let next;
    //   while (!(next = iterator.next()).done) {
    //     const symbol = next.value[2];
    //     const symbolIndex = next.value.index;
    //     const paramIndex = macro.params.indexOf(symbol);
    //     const param = paramsStr.split(/,\s*/g)[paramIndex];
    //     if (paramIndex !== -1) {
    //       str =
    //         str.substring(0, symbolIndex) +
    //         param +
    //         str.substring(symbolIndex! + param.length);
    //     }
    //   }
    // const expressions = str
    //   .replace(/\s+\\\s+|^\\\s+/g, "")
    //   .split(expressionSplitRegex)
    //   .flatMap((e) => parseExpression(e));
    //   return expressions;
    // }
    return { name, params };
  },
};

export default functionCall;
