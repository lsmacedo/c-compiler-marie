import {
  Block,
  Expression,
  FunctionCall,
  FunctionDefinition,
  Macro,
  Operation,
  Return,
  ScopeEnd,
  TypeDefinition,
  Value,
  VariableAssignment,
} from "./types";

const typedefs: TypeDefinition[] = [];
const macros: Macro[] = [];

/**
 * Recursively parse a string into the Value type.
 */
export const parseValue = (value: string): Value => {
  const {
    functionCall,
    arithmetic,
    relational,
    logical,
    literal,
    string,
    array,
    variable,
    prefix,
    postfix,
  } = expressionTypes;
  // Macro
  const macro = macros.find((macro) => macro.name === value);
  if (macro) {
    return macro.value;
  }
  // Literal value (e.g. 5)
  if (literal.regex.test(value)) {
    const { regex, parser } = literal;
    return parser(value.match(regex)!);
  }
  // String value (e.g. "str")
  if (string.regex.test(value)) {
    const { regex, parser } = string;
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

// Parser for function definition parameters
const parseFunctionDefinitionParameters = (
  params: string
): FunctionDefinition["params"] => {
  if (!params) {
    return [];
  }
  const regex =
    /^\s*(?<type>int|char|void)\s*(?<pointer>\*)?\s*(?<name>[^\s\[]+)\s*(\[[^\]]*\])?\s*$/;
  return params
    .split(",")
    .map((param) => {
      const matches = param.match(regex)!;
      return {
        type: matches[1],
        name: matches[3],
        isPointer: matches[2] !== undefined,
        isArray: matches[4] !== undefined,
      };
    })
    .filter((param) => param);
};

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

/**
 * Regular expressions and functions to identify the type of each expression and
 * get the necessary information from them.
 */
const expressionTypes = {
  // Typedef
  typedef: {
    regex: /^\s*typedef\s+(?<type>.+?)\s+(?<alias>[^\s]+?)\s*;?\s*$/,
    parser: (matches: string[]): TypeDefinition => {
      const [_, originalType, alias] = matches;
      return { originalType, alias };
    },
  },
  // Macro
  macro: {
    regex: /^\s*#define\s+(?<name>[^\s]+?)\s+(?<value>.+?)\s*;?\s*$/,
    parser: (matches: string[]): Macro => {
      const [_, name, value] = matches;
      return { name, value: parseValue(value) };
    },
  },
  // Function definition
  functionDefinition: {
    regex:
      /^\s*(?<type>[^\s]+?)\s+(?<pointer>\*)?\s*(?<name>[^\s]+)\s*\(\s*(?<params>.+?)?\s*\)\s*{\s*$/,
    parser: (matches: string[]): FunctionDefinition => {
      const [_, type, pointer, name, params] = matches;
      return {
        type,
        isPointer: pointer !== undefined,
        name,
        params: parseFunctionDefinitionParameters(params),
      };
    },
  },
  // Function call
  functionCall: {
    regex: /^\s*(?<name>[^\s]+?)\s*\(\s*(?<params>[^)]+?)?\s*\)\s*;?$/,
    parser: (matches: RegExpMatchArray): FunctionCall => {
      const [_, name, params] = matches;
      return { name, params: parseFunctionCallParameters(params) };
    },
  },
  // Function return
  return: {
    regex: /^\s*return\s*([^;]*?)?\s*;?\s*$/,
    parser: (matches: string[]): Return => {
      const [_, valueString] = matches;
      return { value: valueString ? parseValue(valueString) : undefined };
    },
  },
  // A block, which may or may not follow an If statement or a loop
  block: {
    regex: /^\s*(?:(?<type>if|while|for)\s*\(\s*(?<content>.*?)\s*\)\s*)?{\s*$/,
    parser: (matches: RegExpMatchArray): Block => {
      const [_, type, content] = matches;
      let condition: Value;
      let forStatements: Expression[] | undefined;
      if (type === "if" || type === "while") {
        condition = parseValue(content);
      } else if (type === "for") {
        const statements = content.split(",");
        condition = parseValue(statements[1]);
        forStatements = [
          parseExpression(statements[0]),
          parseExpression(statements[2]),
        ];
      } else {
        throw new Error("Invalid block type");
      }
      return { type, condition, forStatements };
    },
  },
  // Variable declaration, with or without a value assignment
  variableDeclaration: {
    regex:
      /^\s*(?<type>[^\s]+?)\s+(?<pointer>\*)?\s*(?<name>[^\s\[]+?)\s*(?<array>\[[^\]]*?\])?\s*(?:\=\s*(?<value>.+?))?\s*;?\s*$/,
    parser: (matches: string[]): VariableAssignment => {
      const [_, type, pointer, name, array, value] = matches;
      const typedef = typedefs.find((typedef) => typedef.alias === type);
      return {
        type: typedef?.originalType ?? type,
        name,
        isArray: array !== undefined,
        pointerOperation: pointer !== undefined,
        arraySize:
          array?.length > 2
            ? parseValue(array.substring(1, array.length - 1))
            : undefined,
        value: value ? parseValue(value) : undefined,
      };
    },
  },
  // Assignment of a value to a variable
  variableAssignment: {
    regex:
      /^\s*(?<pointer>\*)?\s*(?<name>[^\s\[]+)\s*(?<array>\[[^\]]+\])?\s*\=\s*(?<value>.+?)\s*;?\s*$/,
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
  // Literal
  literal: {
    regex: /^\s*(?:(?<int>[0-9]+)|'(?<char>[^']?|\\[^'])')\s*;?\s*$/,
    parser: (matches: string[]): Value => {
      const [_, int, char] = matches;
      if (int !== undefined || char !== undefined) {
        return {
          literal: int !== undefined ? Number(int) : char.charCodeAt(0),
        };
      }
      throw new Error("Error parsing literal");
    },
  },
  // String
  string: {
    regex: /^\s*"(?<string>[^"]*)"\s*;?\s*$/,
    parser: (matches: string[]): Value => {
      const [_, string] = matches;
      const elements = string.split("").map((char) => char.charCodeAt(0));
      return { elements: [...elements, 0].map((el) => ({ literal: el })) };
    },
  },
  // Array
  array: {
    regex: /^\s*\[([^\]]+)]\s*;?\s*$/,
    parser: (matches: string[]): Value => {
      const [_, array] = matches;
      return { elements: array.split(",").map((value) => parseValue(value)) };
    },
  },
  // Variable
  variable: {
    regex:
      /^\s*(?<pointer>&)?\s*(?<variable>[^0-9^\s()\+\-\*\/\[\]{}&;][^\s()\+\-\*\/\[\]{}&;]*)\s*(?:\[(?<array>[^\]]+)\])?\s*;?\s*$/,
    parser: (matches: string[]): Value => {
      const [_, pointer, variable, arrayPosition] = matches;
      return {
        variable,
        isAddressOperation: pointer === "&",
        arrayPosition: arrayPosition ? parseValue(arrayPosition) : undefined,
      };
    },
  },
  // Logical operators
  logical: {
    regex:
      /^\s*(?<firstOperand>[^\s]+(?:\(.*?\))|.+?)\s*(?<operator>&&|\|\|)\s*(?<secondOperand>.+?)\s*;?\s*$/,
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
      /^\s*(?<firstOperand>[^\s]+(?:\(.*?\))|[^\s]+)\s*(?<operator>\>=|\<=|==|!=|[><])\s*(?<secondOperand>.+?)\s*;?\s*$/,
    parser: (matches: RegExpMatchArray): Operation => {
      const [_, firstOperandString, operator, secondOperandString] = matches;
      const firstOperand = parseValue(firstOperandString);
      const secondOperand = parseValue(secondOperandString);
      return { firstOperand, operator, secondOperand };
    },
  },
  // Arithmetic expression
  arithmetic: {
    regex:
      /^\s*(?<firstOperand>[^\s+-]+(?:\(.*?\))|[^\s+-]+)\s*(?<operator>(?!\+\+|\-\-)[+\-\*\/%])\s*(?<secondOperand>.+?(?:\(.*?\))|[^]+?)\s*;?\s*$/,
    parser: (matches: RegExpMatchArray): Operation => {
      let [_, firstOperandString, operator, secondOperandString] = matches;

      let firstOperand = parseValue(firstOperandString);
      let secondOperand = parseValue(secondOperandString);

      // Fix expressions order
      // a * b + c gets parsed initially as a * (b + c), when it should be
      // (a * b) + c
      if (
        secondOperand.expression &&
        ["*", "/", "%"].includes(operator) &&
        ["+", "-"].includes(secondOperand.expression.operator)
      ) {
        firstOperand = {
          expression: {
            firstOperand,
            operator,
            secondOperand: secondOperand.expression.firstOperand,
          },
        };
        operator = secondOperand.expression.operator;
        secondOperand = secondOperand.expression.secondOperand;
      }

      return { firstOperand, operator, secondOperand };
    },
  },
  prefix: {
    regex: /^\s*(?<operator>\+\+|--|-|&|\*)\s*(?<value>[^\s]+?)\s*;?\s*?$/,
    parser: (matches: RegExpMatchArray): Value => {
      const [_, operator, value] = matches;
      return { prefix: { operator, value: parseValue(value) } };
    },
  },
  postfix: {
    regex: /^\s*(?<value>[^\s]+?)\s*(?<operator>\+\+|--|-)\s*;?\s*?$/,
    parser: (matches: RegExpMatchArray): Value => {
      const [_, value, operator] = matches;
      return { postfix: { operator, value: parseValue(value) } };
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

export const parseExpression = (line: string): Expression => {
  const expressionType = Object.entries(expressionTypes).find(
    ([_, { regex }]) => regex.test(line)
  )![0] as keyof typeof expressionTypes;
  const matches = line.match(expressionTypes[expressionType].regex);
  const parsed = expressionTypes[expressionType].parser(matches!);

  if (expressionType === "typedef") {
    const typedef = parsed as TypeDefinition;
    typedefs.push(typedef);
    return { expressionType: "" };
  }
  if (expressionType === "macro") {
    const macro = parsed as Macro;
    macros.push(macro);
    return { expressionType: "" };
  }
  return { expressionType, ...parsed };
};

export const parseCode = (code: string): Expression[] => {
  return code
    .replace(/(\/\/.*)/g, "") // Remove single-line comments
    .replace(/\n/g, " ") // Remove line breaks
    .replace(/(\/\*.*\*\/)/g, "") // Remove multi-line comments
    .replace(/(?<=\s*for\s*\([^\)]+);/g, ",") // Replace semicolons inside For statements with commas
    .replace(/(?<==\s*{[^}]*?)}/g, "]") // Temporary: Replace open curly brackets by brackets if following =
    .replace(/(?<==\s*){/g, "[") // Temporary: Replace open curly brackets by brackets if following =
    .match(/(.*?[;{}])/g)! // Split expressions by curly brackets and semicolons
    .map((line) => parseExpression(line))
    .filter(({ expressionType: opType }) => opType);
};

/*
TODO:
- Split array position regex outside of variable context, in order to support
  scenarios like: "Hello World"[2]
- Support commas inside function parameter string
*/
