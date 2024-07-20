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

    const localVariables = this.compilationState.functions[name].variables;

    // Set current scope
    this.compilationState.scope = name;

    // Procedure to calculate offsets for local variables
    this.codegen.procedure(offsetFunctionName(name));
    if (params.length) {
      this.codegen.load({ direct: BASE_POINTER });
      params.forEach((param, index) =>
        this.codegen
          .subt({ literal: index === 0 ? 3 : 1 })
          .store({ direct: param.name })
      );
    }
    if (localVariables.length) {
      this.codegen.load({ direct: BASE_POINTER });
      localVariables.forEach((variable, index) =>
        this.codegen
          .add({ literal: index === 0 ? 0 : 1 })
          .store({ direct: variable.name })
      );
    }
    this.codegen.jumpI(offsetFunctionName(name));

    // Function definition
    this.codegen
      .procedure(name)
      .push({ direct: name })
      .push({ direct: BASE_POINTER })
      .copy({ direct: STACK_POINTER }, { direct: BASE_POINTER });
    if (localVariables.length) {
      this.codegen
        .add({ literal: localVariables.length })
        .store({ direct: STACK_POINTER });
    }
    this.codegen.jnS(offsetFunctionName(name));
  }
}
