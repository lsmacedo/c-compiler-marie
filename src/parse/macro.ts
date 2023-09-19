import { parseExpression } from ".";
import { Expression, Macro, Value } from "../types";
import { macros } from "./state";

export const parseMacroDefinitions = (str: string): string => {
  const macroDefinitions = str.matchAll(
    /#define\s+(?<name>[^\s]+?)(?<params>\([^\)]*?\))?\s+(?<value>(?:\n|.)*?[^\\])\s*\n/g
  );
  let next: IteratorResult<RegExpMatchArray>;
  let returnStr = str;
  while (!(next = macroDefinitions.next()).done) {
    const [_, name, paramsStr, value] = next.value;
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
    returnStr = returnStr.replace(next.value[0], "");
  }
  return returnStr;
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
      .filter((line) => line)
      .flatMap((line) => replaceMacros(parseExpression(line)));
  }
  return [expression];
};

/**
 * Replace function-like macro call with its code
 */
export const parseFunctionLikeMacro = (
  expression: Expression
): Expression[] => {
  const { name, paramsStr } = (expression as Value).functionCall!;
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
      const param = paramsStr?.split(/,\s*/g)[paramIndex] || [];
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
      .filter((line) => line)
      .flatMap((e) => replaceMacros(parseExpression(e)));
  }
  return [expression];
};

export const replaceMacros = (expression: Expression): Expression[] => {
  let response = { expression };
  const expressions: Expression[] = [];
  const stack: [Expression, string, Expression][] = [
    [response as unknown as Expression, "expression", expression],
  ];

  while (stack.length > 0) {
    const [currExpression, key, currChild] = stack.pop()!;

    if ((currChild as Value).variable) {
      const replacedExpressions = parseObjectLikeMacro(currChild);
      (currExpression[key as keyof Expression] as any) = replacedExpressions[0];
      expressions.push(...replacedExpressions.slice(1));
    }

    if ((currChild as Value).functionCall) {
      const replacedExpressions = parseFunctionLikeMacro(currChild);
      (currExpression[key as keyof Expression] as any) = replacedExpressions[0];
      expressions.push(...replacedExpressions.slice(1));
    }

    for (const childKey in currChild) {
      if (
        currChild.hasOwnProperty(childKey) &&
        typeof currChild[childKey as keyof Expression] === "object"
      ) {
        stack.push([
          currChild,
          childKey,
          currChild[childKey as keyof Expression] as unknown as Expression,
        ]);
      }
    }
  }

  expressions.unshift(response.expression);
  return expressions;
};
