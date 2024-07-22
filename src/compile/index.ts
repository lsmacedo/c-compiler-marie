import Container from "typedi";
import { Codegen } from "../marieCodegen";
import {
  Block,
  Expression,
  FunctionDefinition,
  Operation,
  Value,
  VariableAssignment,
} from "../types";
import { CompilerStrategy } from "./compilers";
import { declarePop } from "./procedures/pop";
import { declarePush } from "./procedures/push";
import { CompilationState } from "../compilationState";

export const BASE_POINTER = "_bp";
export const STACK_POINTER = "_sp";
export const RETURN_VALUE = "_rval";
export const RETURN_ADDRESS = "_radd";
export const INTERMEDIATE_VARIABLE = "_ivar";
export const TMP = "_tmp";

const codegen = Container.get(Codegen);
const compilationState = Container.get(CompilationState);
const compilerStrategy = Container.get(CompilerStrategy);

export const offsetFunctionName = (name: string) =>
  `_${name}_calculate_offsets`;

export function compileForMarieAssemblyLanguage(expressions: Expression[]) {
  let currFunction = "";
  let scopeLength = 0;
  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i];

    // Map functions
    if (expression.expressionType === "functionDefinition") {
      const definition = expression as FunctionDefinition;
      currFunction = definition.name;
      compilationState.functions[currFunction] = {
        type: definition.type,
        parameters: definition.params,
        variables: {},
        scopes: [],
        scopesCount: 0,
        intermediateVariablesCount: 0,
        earlyReturns: 0,
        earlyReturnsRemaining: 0,
      };
      scopeLength++;
    }
    // Increment and decrement scope length
    if (expression.expressionType === "block") {
      scopeLength++;
    }
    if (expression.expressionType === "blockEnd") {
      scopeLength--;
    }
    // Map local variables
    if (expression.expressionType === "variableDeclaration") {
      const declaration = expression as VariableAssignment;
      compilationState.functions[currFunction].variables[declaration.name] = {
        isPointer: declaration.pointerOperation ?? false,
        isArray: declaration.isArray ?? false,
        size:
          // Array size must be known at compile time
          declaration.arraySize?.literal ??
          declaration.value?.elements?.length ??
          1,
      };
    }
    if (
      expression.expressionType === "block" &&
      "forStatements" in expression
    ) {
      compilationState.functions[currFunction].variables[
        (expression.forStatements![0] as VariableAssignment).name
      ] = { isPointer: false, isArray: false, size: 1 };
    }
    // Introduce intermediate variable if expression contains multiple function
    // calls
    if ("value" in expression && expression.value?.expression) {
      const r = handleExpressionFunctionCalls(expression, currFunction);
      if (r.length) {
        expressions.splice(i, 1, ...r);
        i += r.length - 1;
      }
    }
    // Count amount of early returns for each function
    if (expression.expressionType === "return") {
      const nextExpression = expressions[i + 1];
      if (nextExpression.expressionType !== "blockEnd" || scopeLength > 1) {
        compilationState.functions[currFunction].earlyReturns++;
        compilationState.functions[currFunction].earlyReturnsRemaining++;
      }
    }
  }

  codegen.org(400).jnS("main").clear().halt();
  expressions.forEach((expression) => compilerStrategy.compile(expression));

  declarePush(codegen);
  declarePop(codegen);

  return codegen.getCode();
}

function handleExpressionFunctionCalls(
  expression: Expression,
  currFunction: string
): Expression[] {
  // TODO: apply same for function call parameters
  if (!("value" in expression) || !expression.value?.expression) {
    return [];
  }
  // Check if expression contains multiple function calls
  const functionCalls = functionCallsCount(expression.value.expression);
  if (functionCalls < 2) {
    return [];
  }
  // Create intermediate variable
  const count = compilationState.functions[currFunction]
    .intermediateVariablesCount++;
  const variable = `${INTERMEDIATE_VARIABLE}${count}`;
  compilationState.functions[currFunction].variables[variable] = {
    isPointer: false,
    isArray: false,
    size: 1,
  };
  // Introduce intermediate variable
  const remaining = functionCalls - 1;
  const [variableDeclarations, value] = introduceIntermediateVariables(
    expression.value,
    variable,
    remaining
  );
  return [...variableDeclarations, { ...expression, value }];
}

function functionCallsCount(operation: Operation): number {
  let count = 0;
  if (operation.firstOperand.functionCall) {
    count++;
  }
  if (operation.firstOperand.expression) {
    count += functionCallsCount(operation.firstOperand.expression);
  }
  if (operation.secondOperand.functionCall) {
    count++;
  }
  if (operation.secondOperand.expression) {
    count += functionCallsCount(operation.secondOperand.expression);
  }
  return count;
}

function introduceIntermediateVariables(
  value: Value,
  variable: string,
  remaining: number
): [Expression[], Value] {
  if (value.functionCall) {
    return remaining === 0
      ? [[], value]
      : [
          [
            {
              expressionType: "variableDeclaration",
              name: variable,
              value: { functionCall: value.functionCall },
            },
          ],
          { variable },
        ];
  }
  if (value.expression) {
    const { firstOperand, operator, secondOperand } = value.expression;
    const [declarations1, value1] = introduceIntermediateVariables(
      firstOperand,
      variable,
      remaining
    );
    const [declarations2, value2] = introduceIntermediateVariables(
      secondOperand,
      variable,
      remaining - declarations1.length
    );
    return [
      [...declarations1, ...declarations2],
      { expression: { firstOperand: value1, operator, secondOperand: value2 } },
    ];
  }
  return [[], value];
}
