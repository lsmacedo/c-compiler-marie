import { Service } from "typedi";
import { BASE_POINTER, RETURN_ADDRESS, STACK_POINTER } from "..";
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
      this.codegen.label(`end${scope.label}`).clear();
      currFunction.scopesCount++;
      return;
    }
    // End of function
    if (currFunction.earlyReturns > 0) {
      this.codegen
        .label(`end${this.compilationState.currFunctionName}`)
        .clear();
    }
    this.codegen
      .copy({ direct: BASE_POINTER }, { direct: STACK_POINTER })
      .pop({ direct: BASE_POINTER })
      .pop({ direct: RETURN_ADDRESS })
      .subtValues(
        { direct: STACK_POINTER },
        { literal: currFunction.parameters.length },
        true
      )
      .jumpI(RETURN_ADDRESS);
  }
}
