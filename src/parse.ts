import {
  Block,
  Expression,
  FunctionCall,
  FunctionDefinition,
  Operation,
  Return,
  ScopeEnd,
  Value,
  VariableAssignment,
} from "./types";

/**
 * Recursively parse a string into the Value type.
 */
const parseValue = (value: string): Value => {
  const { functionCall, arithmetic, relational } = expressionTypes;
  // Function call (e.g. func(x, 10))
  if (functionCall.regex.test(value)) {
    const { regex, parser } = functionCall;
    return { functionCall: parser(value.match(regex)!) };
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
  // Literal value (e.g. 5)
  if (!isNaN(Number(value))) {
    return { literal: value };
  }
  // Otherwise, consider it a variable (e.g. x)
  const arrayRegex = /(?:\[)([^\]]+)(?:\])/;
  const array = value.match(arrayRegex);
  let arrayPosition: Value | undefined;
  if (array) {
    arrayPosition = parseValue(array[1]);
  }
  const addressOperation = value.trim().startsWith("&");
  const pointerOperation = value.trim().startsWith("*");
  return {
    variable: value
      .replace(arrayRegex, "")
      .replace(/[\*\&]/g, "")
      .trim(),
    addressOperation,
    pointerOperation,
    arrayPosition,
  };
};

/**
 * Regular expressions and functions to identify the type of each expression and
 * get the necessary information from them.
 */
const expressionTypes = {
  // Function definition
  functionDefinition: {
    regex:
      /^\s*(?<type>int|void)\s*(?<name>[^\s]+)\s*\(\s*(?<params>.+?)?\s*\)\s*{\s*$/,
    parser: (matches: string[]): FunctionDefinition => {
      const [_, type, name, paramsString] = matches;
      let params: FunctionDefinition["params"] = [];
      if (paramsString) {
        params = paramsString
          .split(",")
          .map((param) => {
            const matches = param.match(
              /^\s*(?<type>int)\s*(?<pointer>\*)?\s*(?<name>[^\s\[]+)\s*(\[[^\]]*\])?\s*$/
            );
            if (!matches) {
              throw new Error("Invalid syntax");
            }
            return {
              type: matches[1],
              name: matches[3],
              isArray: matches[4] !== undefined,
            };
          })
          .filter((param) => param);
      }
      return { type, name, params };
    },
  },
  // Function call
  functionCall: {
    regex: /^\s*(?<name>[^\s]+?)\s*\(\s*(?<params>[^)]+?)?\s*\)\s*;?$/,
    parser: (matches: RegExpMatchArray): FunctionCall => {
      const [_, name, paramsString] = matches;
      let params: Value[] = [];
      if (paramsString) {
        params = paramsString
          // Following regex is not yet bullet-proof and might fail with the
          // string "x, y, func(x, y, func2(x, y), x, y)" because the comma
          // after func2(x, y) is matched.
          .split(/(?<!.+?\([^)]+),/g)
          .map((param) => parseValue(param.trim()))
          .filter((param) => param);
      }
      return { name, params };
    },
  },
  // Variable declaration, with or without a value assignment
  variableDeclaration: {
    regex:
      /^\s*(?<type>int)\s*(?<pointer>\*)?\s*(?<name>[^\s\[]+)\s*(?<array>\[[^\]]+\])?\s*(?:\=\s*(?<value>.+))?\s*;\s*$/,
    parser: (matches: string[]): VariableAssignment => {
      const [_, type, pointer, name, array, value] = matches;
      return {
        type,
        name,
        arraySize: array
          ? parseValue(array.substring(1, array.length - 1))
          : undefined,
        value: value ? parseValue(value) : undefined,
      };
    },
  },
  // Assignment of a value to a variable
  variableAssignment: {
    regex:
      /^\s*(?<pointer>\*)?\s*(?<name>[^\s\[]+)\s*(?<array>\[[^\]]+\])?\s*\=\s*(?<value>.+)\s*;\s*$/,
    parser: (matches: string[]): VariableAssignment => {
      const [_, pointer, name, array, value] = matches;
      return {
        name,
        pointerOperation: pointer !== undefined,
        arrayPosition: array
          ? parseValue(array.substring(1, array.length - 1))
          : undefined,
        value: parseValue(value),
      };
    },
  },
  // Function return
  return: {
    regex: /^\s*return\s*([^;]+?)?\s*;?\s*$/,
    parser: (matches: string[]): Return => {
      const [_, valueString] = matches;
      return { value: parseValue(valueString) };
    },
  },
  // A block, which may or may not follow an If statement or a loop
  block: {
    regex: /^\s*(?:(?<type>if|while)\s*\(\s*(?<value>.*?)\s*\)\s*)?{\s*$/,
    parser: (matches: RegExpMatchArray): Block => {
      const [_, type, conditionString] = matches;
      return { type, value: parseValue(conditionString) };
    },
  },
  // Arithmetic expression
  arithmetic: {
    regex:
      /^\s*(?<firstOperand>[^\s\[]+)\s*(?<operator>[+\-])\s*(?<secondOperand>.+?)\s*;?\s*$/,
    parser: (matches: RegExpMatchArray): Operation => {
      const [_, firstOperandString, operator, secondOperandString] = matches;
      const firstOperand = parseValue(firstOperandString);
      const secondOperand = parseValue(secondOperandString);
      return { firstOperand, operator, secondOperand };
    },
  },
  // Relational expression
  relational: {
    regex:
      /^\s*(?<firstOperand>[^\s]+)\s*(?<operator>\>=|\<=|==|!=|[><])\s*(?<secondOperand>.+?)\s*;?\s*$/,
    parser: (matches: RegExpMatchArray): Operation => {
      const [_, firstOperandString, operator, secondOperandString] = matches;
      const firstOperand = parseValue(firstOperandString);
      const secondOperand = parseValue(secondOperandString);
      return { firstOperand, operator, secondOperand };
    },
  },
  // End of a block
  blockEnd: {
    regex: /^\s*(?<type>})\s*$/,
    parser: (matches: string[]): ScopeEnd => {
      return { type: matches[1] };
    },
  },
};

export const parseCode = (code: string): Expression[] => {
  return code
    .replace(/(\/\/.*)/g, "") // Remove single-line comments
    .replace(/\n/g, " ") // Remove line breaks
    .replace(/(\/\*.*\*\/)/g, "") // Remove multi-line comments
    .match(/(.*?[;{}])/g)! // Split expressions by characters ; { }
    .map((line) => {
      const expressionType = Object.entries(expressionTypes).find(
        ([_, { regex }]) => regex.test(line)
      )![0] as keyof typeof expressionTypes;
      const matches = line.match(expressionTypes[expressionType].regex);
      return {
        expressionType,
        ...expressionTypes[expressionType].parser(matches!),
      };
    })
    .filter(({ expressionType: opType }) => opType);
};
