import Container from "typedi";
import { Codegen } from "../marieCodegen";
import {
  Expression,
  FunctionDefinition,
  Value,
  VariableAssignment,
} from "../types";
import { CompilerStrategy } from "./compilers";
import { declarePop } from "./procedures/pop";
import { declarePush } from "./procedures/push";
import { CompilationState } from "../compilationState";
import {
  COMPARE_EQ,
  COMPARE_GT,
  COMPARE_GTE,
  COMPARE_LT,
  COMPARE_LTE,
  COMPARE_NEQ,
  declareCompareEq,
  declareCompareGt,
  declareCompareGte,
  declareCompareLt,
  declareCompareLte,
  declareCompareNeq,
} from "./procedures/compare";
import { declareLoadIndirect, LOAD_INDIRECT } from "./procedures/loadIndirect";
import { INTERMEDIATE_VARIABLE } from "./constants";
import {
  declarePrefixDecrement,
  declarePrefixIncrement,
  PREFIX_DECREMENT,
  PREFIX_INCREMENT,
} from "./procedures/prefix";
import {
  declarePostfixDecrement,
  declarePostfixIncrement,
  POSTFIX_DECREMENT,
  POSTFIX_INCREMENT,
} from "./procedures/postfix";

const codegen = Container.get(Codegen);
const compilationState = Container.get(CompilationState);
const compilerStrategy = Container.get(CompilerStrategy);

export function compileForMarieAssemblyLanguage(expressions: Expression[]) {
  let currFunction = "";
  let scopeLength = 0;
  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i];

    // Map functions
    if (expression.expressionType === "functionDefinition") {
      const definition = expression as FunctionDefinition;
      compilationState.defineFunction(
        definition.name,
        definition.type,
        definition.params
      );
      currFunction = definition.name;
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
      "forStatements" in expression &&
      expression.forStatements
    ) {
      compilationState.functions[currFunction].variables[
        (expression.forStatements![0] as VariableAssignment).name
      ] = { isPointer: false, isArray: false, size: 1 };
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

  const codeBeforeProcedures = codegen.getCode();

  declarePush(codegen);
  declarePop(codegen);

  const proceduresToDeclare = {
    [LOAD_INDIRECT]: declareLoadIndirect,
    [PREFIX_INCREMENT]: declarePrefixIncrement,
    [PREFIX_DECREMENT]: declarePrefixDecrement,
    [POSTFIX_INCREMENT]: declarePostfixIncrement,
    [POSTFIX_DECREMENT]: declarePostfixDecrement,
    [COMPARE_EQ]: declareCompareEq,
    [COMPARE_NEQ]: declareCompareNeq,
    [COMPARE_GT]: declareCompareGt,
    [COMPARE_GTE]: declareCompareGte,
    [COMPARE_LT]: declareCompareLt,
    [COMPARE_LTE]: declareCompareLte,
  };

  Object.entries(proceduresToDeclare)
    .filter(([procedure]) => codeBeforeProcedures.includes(`JnS ${procedure}`))
    .forEach(([_, declareProcedure]) => declareProcedure(codegen));

  return codegen.getCode();
}
