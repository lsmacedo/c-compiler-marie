import { parseExpression } from "..";
import { Expression, FunctionCall, Macro, Value } from "../../types";
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
    // Set value string if macro is object-like and a valid value
    const parsed = {
      name,
      params,
      value,
    };
    macros.push(parsed);
    return parsed;
  },
};

/**
 * Replace object-like macro reference with its code
 */
export const parseObjectLikeMacro = (expression: Expression): Expression[] => {
  const variable = (expression as Value).variable;
  const macro = macros.find((macro) => macro.name === variable);
  if (macro) {
    return macro.value
      .replace(/\s+\\\s+|^\\\s+/g, "")
      .split(/[;{}](?!\s+\\\s+)/gm)
      .flatMap((expression) => replaceMacros(parseExpression(expression)));
  }
  return [expression];
};

/**
 * Replace function-like macro call with its code
 */
export const parseFunctionLikeMacro = (
  expression: Expression,
  key?: keyof Expression
): Expression[] => {
  const { name, paramsStr } = (
    key ? expression[key] : expression
  ) as FunctionCall;
  const macro = macros.find((macro) => macro.name === name);
  if (macro?.params) {
    let str = macro.value;
    const iterator = str.matchAll(
      /(?<b>".*?")|(?<a>[^\s+\-\*/%=<>&;,{}()"]+)/g
    );
    let next;
    let sizeDelta = 0;
    while (!(next = iterator.next()).done) {
      const symbol = next.value[2];
      const symbolIndex = next.value.index! + sizeDelta;
      const paramIndex = macro.params.indexOf(symbol);
      const param = paramsStr.split(/,\s*/g)[paramIndex];
      if (paramIndex !== -1) {
        str =
          str.substring(0, symbolIndex) +
          param +
          str.substring(symbolIndex + symbol.length);
        sizeDelta += param.length - symbol.length;
      }
    }
    return str
      .replace(/\s+\\\s+|^\\\s+/g, "")
      .split(/[;{}](?!\s+\\\s+)/gm)
      .flatMap((e) => replaceMacros(parseExpression(e)));
  }
  return [expression];
};

/**
 * Recursively look for macro references in the expression and replace with
 * their code
 */
export const replaceMacros = (
  expression: Expression
): Expression | Expression[] => {
  const keys = Object.keys(expression);
  if (!keys) {
    return expression;
  }
  const expressions: Expression[] = [];
  Object.entries(expression).forEach(([key, value]) => {
    // Object-like Macro
    if (key === "variable") {
      expressions.push(...parseObjectLikeMacro(expression));
    }
    if (key === "value" && (value as Value)?.variable) {
      const parsedMacro = parseObjectLikeMacro(value);
      (expression as Expression & { value: Value }).value =
        parsedMacro[0] as Value;
      expressions.push(expression);
      expressions.push(...parsedMacro.slice(1));
    }
    // Function-like Macro
    if (key === "expressionType" && value === "functionCall") {
      expressions.push(...parseFunctionLikeMacro(expression));
    }
    if (key === "value" && (value as Value)?.functionCall) {
      const parsedMacro = parseFunctionLikeMacro(
        value,
        "functionCall" as keyof Expression
      );
      (expression as Expression & { value: Value }).value =
        parsedMacro[0] as Value;
      expressions.push(expression);
      expressions.push(...parsedMacro.slice(1));
    }
    return !value || typeof value !== "object" ? value : replaceMacros(value);
  });
  return expressions.length ? expressions : expression;
};

export default macro;
