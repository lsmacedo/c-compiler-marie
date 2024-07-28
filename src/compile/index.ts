import Container from "typedi";
import { Codegen } from "../marieCodegen";
import { Expression, FunctionDefinition, VariableAssignment } from "../types";
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

  declarePush(codegen);
  declarePop(codegen);

  let code = codegen.getCode();

  // Replace function params count
  Object.entries(compilationState.functions).forEach(([name, func]) => {
    const count = Object.entries(func.variables).reduce(
      (acc, curr) => acc + curr[1].size ?? 1,
      0
    );
    if (count > 0) {
      code = code.replace(`ADD_FUNCTION_${name}_PARAMS_COUNT`, `Add _${count}`);
      if (!code.includes(`_${count}, DEC ${count}`)) {
        code += `\n_${count}, DEC ${count}`;
      }
    } else {
      code = code.replace(`ADD_FUNCTION_${name}_PARAMS_COUNT\n`, ``);
    }
  });

  return code;
}
