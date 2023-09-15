import { expressionTypes } from "./expression";
import { Expression, Value } from "../types";
import { replaceMacros } from "./expression/macro";

/**
 * Recursively parse a string into the Value type.
 */
export const parseValue = (value: string): Value => {
  const {
    type,
    functionCall,
    arithmetic,
    relational,
    logical,
    literal,
    array,
    variable,
    prefix,
    postfix,
  } = expressionTypes;
  // Type
  if (type.isType(value)) {
    const { regex, parser } = type;
    return parser(value.match(regex)!);
  }
  // Literal value (e.g. 5)
  if (literal.regex.test(value)) {
    const { regex, parser } = literal;
    return parser(value.match(regex)!);
  }
  // Array value (e.g. { 1, 2, 3 })
  if (array.regex.test(value)) {
    const { regex, parser } = array;
    return parser(value.match(regex)!);
  }
  // Variable (e.g. x)
  if (variable.regex.test(value)) {
    const { regex, parser } = variable;
    return parser(value.match(regex)!);
  }
  // Function call (e.g. func(x, 10))
  if (functionCall.regex.test(value)) {
    const { regex, parser } = functionCall;
    return { functionCall: parser(value.match(regex)!) };
  }
  // Logical operator (e.g. x || y)
  if (logical.regex.test(value)) {
    const { regex, parser } = logical;
    return { expression: parser(value.match(regex)!) };
  }
  // Relational expression (e.g. x == 5)
  if (relational.regex.test(value)) {
    const { regex, parser } = relational;
    return { expression: parser(value.match(regex)!) };
  }
  // Arithmetic expression (e.g. x + 1)
  if (arithmetic.regex.test(value)) {
    const { regex, parser } = arithmetic;
    return { expression: parser(value.match(regex)!) };
  }
  // Prefix to a value (e.g. ++x or ++*x or *++x)
  if (prefix.regex.test(value)) {
    const { regex, parser } = prefix;
    return parser(value.match(regex)!);
  }
  // Postfix to a value (e.g. x++)
  if (postfix.regex.test(value)) {
    const { regex, parser } = postfix;
    return parser(value.match(regex)!);
  }
  throw new Error(`Unable to parse value ${value}`);
};

/**
 * Parse a line of code into the Expression type.
 */
export const parseExpression = (line: string): Expression => {
  // Identify appropriate regex and get key elements from string
  let matches: RegExpMatchArray | null | undefined;
  let expressionType: keyof typeof expressionTypes | undefined;
  for (const [type, { regex }] of Object.entries(expressionTypes)) {
    matches = line.match(regex);
    if (matches !== null) {
      expressionType = type as keyof typeof expressionTypes;
      break;
    }
  }
  if (!expressionType || !matches) {
    throw new Error(`Error parsing expression: ${line}`);
  }
  // Parse expression
  const parsed = expressionTypes[expressionType].parser(matches);
  return { expressionType, ...parsed };
};

export const parseCode = (code: string): Expression[] => {
  return code
    .replace(/(\/\/.*)/g, "") // Remove single-line comments
    .replace(/^\s*#include\s+.+?\s*$/gm, "")
    .replace(/\n/g, " ") // Remove line breaks
    .replace(/(\/\*.*\*\/)/g, "") // Remove multi-line comments
    .replace(/(?<=\s*for\s*\([^\)]+);/g, ",") // Replace semicolons inside For statements with commas
    .replace(/(?<==\s*{[^}]*?)}/g, "]") // Temporary: Replace open curly brackets by brackets if following =
    .replace(/(?<==\s*){/g, "[") // Temporary: Replace open curly brackets by brackets if following =
    .match(/(.*?[;{}](?!\s+\\\s+))/gm)! // Split expressions by curly brackets and semicolons;
    .flatMap((line) => {
      const expression = parseExpression(line);
      const replaced = replaceMacros(expression);
      return replaced;
    })
    .filter(
      ({ expressionType: opType }) =>
        opType && !["typedef", "macro"].includes(opType)
    );
};
