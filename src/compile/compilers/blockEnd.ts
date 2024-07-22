import { Service } from "typedi";
import { BASE_POINTER, RETURN_ADDRESS, STACK_POINTER } from "..";
import { Codegen } from "../../marieCodegen";
import { Expression } from "../../types";
import { IExpressionCompiler } from "./type";
import { CompilationState } from "../../compilationState";

@Service()
export class BlockEndCompiler implements IExpressionCompiler {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState
  ) {}

  compile(expression: Expression): void {
    const currFunction = this.compilationState.currFunction();
    const scope = currFunction.scopes.pop();
    if (scope) {
      this.codegen.label(`end${scope.type}${currFunction.scopesCount}`).clear();
      currFunction.scopesCount++;
      return;
    }
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
