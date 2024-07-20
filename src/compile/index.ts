import Container from "typedi";
import { Codegen } from "../marieCodegen";
import { Expression, FunctionDefinition, VariableAssignment } from "../types";
import { CompilerStrategy } from "./compilers";
import { declarePop } from "./procedures/pop";
import { declarePush } from "./procedures/push";
import { declareReturn } from "./procedures/return";
import { CompilationState } from "../compilationState";

export const BASE_POINTER = "_bp";
export const STACK_POINTER = "_sp";
export const RETURN_VALUE = "_rval";

export const offsetFunctionName = (name: string) =>
  `_${name}_calculate_offsets`;

export function compileForMarieAssemblyLanguage(expressions: Expression[]) {
  const codegen = Container.get(Codegen);
  const compilationState = Container.get(CompilationState);
  const compilerStrategy = Container.get(CompilerStrategy);

  let currFunction = "";
  expressions.forEach((expression) => {
    if (expression.expressionType === "functionDefinition") {
      const definition = expression as FunctionDefinition;
      currFunction = definition.name;
      compilationState.functions[currFunction] = {
        parameters: definition.params,
        variables: [],
      };
    }
    if (expression.expressionType === "variableDeclaration") {
      const declaration = expression as VariableAssignment;
      compilationState.functions[currFunction].variables.push({
        name: declaration.name,
      });
    }
  });

  codegen.org(400).jnS("main").clear().halt();
  expressions.forEach((expression) => compilerStrategy.compile(expression));

  declarePush(codegen);
  declarePop(codegen);
  declareReturn(codegen);

  return codegen.getCode();
}
