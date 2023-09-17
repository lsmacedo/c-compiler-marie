import { parseExpression } from "../../parse";
import {
  Expression,
  FunctionDefinition,
  Macro,
  Return,
  ScopeEnd,
  TypeDefinition,
  VariableAssignment,
} from "../../types";

describe("parseExpression", () => {
  describe("typedef", () => {
    it("should define a new alias to a type", () => {
      const expression = "typedef int bool";
      const parsed = parseExpression(expression);

      const expected: Expression & TypeDefinition = {
        expressionType: "typedef",
        originalType: "int",
        alias: "bool",
      };
      expect(parsed).toEqual(expected);
    });
  });
  describe("macro", () => {
    it("should define object-like macro", () => {
      const expression = "#define true 1";
      const parsed = parseExpression(expression);

      const expected: Expression & Macro = {
        expressionType: "macro",
        name: "true",
        value: "1",
      };
      expect(parsed).toEqual(expected);
    });
  });
  describe("functionDefinition", () => {
    it("should parse function definition without parameters", () => {
      const expression = "int main() {";
      const parsed = parseExpression(expression);

      const expected: Expression & FunctionDefinition = {
        expressionType: "functionDefinition",
        type: "int",
        isPointer: false,
        name: "main",
        params: [],
        isVariadic: false,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse function definition of alias type", () => {
      parseExpression("typedef int bool");
      const expression = "bool main() {";
      const parsed = parseExpression(expression);

      const expected: Expression & FunctionDefinition = {
        expressionType: "functionDefinition",
        type: "int",
        isPointer: false,
        name: "main",
        params: [],
        isVariadic: false,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse function definition with parameters", () => {
      const expression = "void process(int num, char *ptr, char str[]) {";
      const parsed = parseExpression(expression);

      const expected: Expression & FunctionDefinition = {
        expressionType: "functionDefinition",
        type: "void",
        isPointer: false,
        name: "process",
        params: [
          {
            type: "int",
            name: "num",
            isPointer: false,
            isArray: false,
          },
          {
            type: "char",
            name: "ptr",
            isPointer: true,
            isArray: false,
          },
          {
            type: "char",
            name: "str",
            isPointer: false,
            isArray: true,
          },
        ],
        isVariadic: false,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse function definition with parameter of alias type", () => {
      parseExpression("typedef int bool");
      const expression = "void process(bool skip) {";
      const parsed = parseExpression(expression);

      const expected: Expression & FunctionDefinition = {
        expressionType: "functionDefinition",
        type: "void",
        isPointer: false,
        name: "process",
        params: [
          {
            type: "int",
            name: "skip",
            isPointer: false,
            isArray: false,
          },
        ],
        isVariadic: false,
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("variable declaration and assignment", () => {
    it("should parse variable declaration without initial value", () => {
      const expression = "int x";
      const parsed = parseExpression(expression);

      const expected: Expression & VariableAssignment = {
        expressionType: "variableDeclaration",
        type: "int",
        name: "x",
        isArray: false,
        pointerOperation: false,
        arraySize: undefined,
        value: undefined,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse variable declaration with an initial value", () => {
      const expression = "char *ptr = str";
      const parsed = parseExpression(expression);

      const expected: Expression & VariableAssignment = {
        expressionType: "variableDeclaration",
        type: "char",
        name: "ptr",
        isArray: false,
        pointerOperation: true,
        arraySize: undefined,
        value: {
          variable: "str",
          arrayPosition: undefined,
          isAddressOperation: false,
        },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse assignment of value to variable", () => {
      const expression = "x = 5";
      const parsed = parseExpression(expression);

      const expected: Expression & VariableAssignment = {
        expressionType: "variableAssignment",
        name: "x",
        arrayPosition: undefined,
        pointerOperation: false,
        value: { literal: 5 },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse assignment of value to variable at position", () => {
      const expression = "array[0] = 1";
      const parsed = parseExpression(expression);

      const expected: Expression & VariableAssignment = {
        expressionType: "variableAssignment",
        name: "array",
        arrayPosition: { literal: 0 },
        pointerOperation: false,
        value: { literal: 1 },
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse assignment of value to address referenced by pointer", () => {
      const expression = "*ptr = 10";
      const parsed = parseExpression(expression);

      const expected: Expression & VariableAssignment = {
        expressionType: "variableAssignment",
        name: "ptr",
        arrayPosition: undefined,
        pointerOperation: true,
        value: { literal: 10 },
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("function return", () => {
    it("should parse function return without value", () => {
      const expression = "return";
      const parsed = parseExpression(expression);

      const expected: Expression & Return = {
        expressionType: "return",
        value: undefined,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse function return with value", () => {
      const expression = "return 42";
      const parsed = parseExpression(expression);

      const expected: Expression & Return = {
        expressionType: "return",
        value: { literal: 42 },
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("flow control statements", () => {
    it("should parse if statement", () => {
      const expression = "if (0 > 1) {";
      const parsed = parseExpression(expression);

      const expected: Expression & Return = {
        expressionType: "block",
        type: "if",
        condition: {
          expression: {
            firstOperand: { literal: 0 },
            operator: ">",
            secondOperand: { literal: 1 },
          },
        },
        forStatements: undefined,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse while statement", () => {
      const expression = "while (1) {";
      const parsed = parseExpression(expression);

      const expected: Expression & Return = {
        expressionType: "block",
        type: "while",
        condition: { literal: 1 },
        forStatements: undefined,
      };
      expect(parsed).toEqual(expected);
    });

    it("should parse for statement", () => {
      // As a temporary solution to a bug, semicolons are replaced with commas
      // inside the for statement before parsing
      const expression = "for (int i = 0, i < 9, i++) {";
      const parsed = parseExpression(expression);

      const expected: Expression & Return = {
        expressionType: "block",
        type: "for",
        condition: {
          expression: {
            firstOperand: {
              variable: "i",
              arrayPosition: undefined,
              isAddressOperation: false,
            },
            operator: "<",
            secondOperand: { literal: 9 },
          },
        },
        forStatements: [
          {
            expressionType: "variableDeclaration",
            type: "int",
            name: "i",
            value: { literal: 0 },
            arraySize: undefined,
            isArray: false,
            pointerOperation: false,
          },
          {
            expressionType: "postfix",
            postfix: {
              operator: "++",
              value: {
                variable: "i",
                arrayPosition: undefined,
                isAddressOperation: false,
              },
            },
          },
        ],
      };
      expect(parsed).toEqual(expected);
    });
  });

  describe("block end", () => {
    it("should parse end of blocks", () => {
      const expression = "}";
      const parsed = parseExpression(expression);

      const expected: Expression & ScopeEnd = {
        expressionType: "blockEnd",
        type: "}",
      };
      expect(parsed).toEqual(expected);
    });
  });
});
