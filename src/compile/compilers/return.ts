import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Expression, Return } from "../../types";
import { EvalStrategy } from "../eval";
import { IExpressionCompiler } from "./type";
import { RETURN_VALUE } from "..";
import { CompilationState } from "../../compilationState";

@Service()
export class ReturnCompiler implements IExpressionCompiler {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState,
    private evalStrategy: EvalStrategy
  ) {}

  compile(expression: Expression): void {
    const { value } = expression as Return;
    if (!value) {
      return;
    }
    const currFunction = this.compilationState.currFunction();
    this.evalStrategy.evaluate(value, "load");
    this.codegen.store({ direct: RETURN_VALUE });
    if (currFunction.earlyReturnsRemaining > 0) {
      currFunction.earlyReturnsRemaining--;
      this.codegen.jump(`end${this.compilationState.currFunctionName}`);
    }
  }
}
