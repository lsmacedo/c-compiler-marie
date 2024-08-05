import { Service } from "typedi";
import {
  BASE_POINTER,
  RETURN_ADDRESS,
  STACK_POINTER,
  epilogueFunctionName,
  offsetFunctionName,
  prologueFunctionName,
  scopeEndLabelName,
} from "../constants";
import { Codegen } from "../../marieCodegen";
import { Expression } from "../../types";
import { IExpressionCompiler } from "./type";
import { CompilationState } from "../../compilationState";
import { CompilerStrategy } from ".";

@Service()
export class BlockEndCompiler implements IExpressionCompiler {
  // Set manually to avoid circular dependency error with TypeDI
  private compilerStrategy: CompilerStrategy;

  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState
  ) {}

  setStrategy(compilerStrategy: CompilerStrategy) {
    this.compilerStrategy = compilerStrategy;
  }

  compile(expression: Expression): void {
    const currFunction = this.compilationState.currFunction();
    const scope = currFunction.scopes.pop();

    // End of conditional or loop
    if (scope) {
      if (scope.type === "for") {
        this.compilerStrategy.compile(scope.forStatements![1]);
        this.codegen.jump(scope.label);
      }
      if (scope.type === "while") {
        this.codegen.jump(scope.label);
      }
      this.codegen.label(scopeEndLabelName(scope.label)).clear();
      return;
    }

    // End of function
    const name = this.compilationState.currFunctionName;
    const { parameters, variables } = this.compilationState.currFunction();
    const localVariables = Object.entries(variables);
    this.codegen.jnS(epilogueFunctionName(name));

    // Prologue procedure
    const stackSize = localVariables.reduce((acc, cur) => acc + cur[1].size, 0);
    this.codegen
      .procedure(prologueFunctionName(name))
      .push({ direct: name })
      .push({ direct: BASE_POINTER })
      .copy({ direct: STACK_POINTER }, { direct: BASE_POINTER })
      .add({ literal: stackSize })
      .store({ direct: STACK_POINTER })
      .jnS(offsetFunctionName(name))
      .jumpI(prologueFunctionName(name));

    // Epilogue procedure
    this.codegen
      .procedure(epilogueFunctionName(name))
      .copy({ direct: BASE_POINTER }, { direct: STACK_POINTER })
      .pop({ direct: BASE_POINTER })
      .pop({ direct: RETURN_ADDRESS })
      .subtValues(
        { direct: STACK_POINTER },
        { literal: currFunction.parameters.length },
        true
      )
      .jumpI(RETURN_ADDRESS);

    // Procedure to calculate offsets for local variables
    this.codegen.procedure(offsetFunctionName(name));
    if (parameters.length) {
      this.codegen.load({ direct: BASE_POINTER });
      parameters.forEach((param, index, unused) =>
        this.codegen
          .subt({ literal: index === 0 ? 3 : 1 })
          .store({ direct: param.name })
      );
    }
    if (localVariables.length) {
      this.codegen.load({ direct: BASE_POINTER });
      localVariables.forEach((variable, index) =>
        this.codegen
          .store({ direct: variable[0] })
          .add(
            index === localVariables.length - 1
              ? { literal: 0 }
              : { literal: variable[1].size }
          )
      );
    }
    this.codegen.jumpI(offsetFunctionName(name));
  }
}
