import { Service } from "typedi";
import { BASE_POINTER, STACK_POINTER, offsetFunctionName } from "..";
import { Codegen } from "../../marieCodegen";
import { Expression, FunctionDefinition } from "../../types";
import { IExpressionCompiler } from "./type";
import { CompilationState } from "../../compilationState";

@Service()
export class FunctionDefinitionCompiler implements IExpressionCompiler {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState
  ) {}

  compile(expression: Expression): void {
    const { name, params } = expression as FunctionDefinition;

    const localVariables = Object.entries(
      this.compilationState.functions[name].variables
    );

    // Set current scope
    this.compilationState.currFunctionName = name;

    // Function definition
    this.codegen
      .procedure(name)
      .push({ direct: name })
      .push({ direct: BASE_POINTER })
      .copy({ direct: STACK_POINTER }, { direct: BASE_POINTER });
    this.codegen
      .write(`ADD_FUNCTION_${name}_PARAMS_COUNT`)
      .store({ direct: STACK_POINTER });
    this.codegen.jnS(offsetFunctionName(name));
  }
}
