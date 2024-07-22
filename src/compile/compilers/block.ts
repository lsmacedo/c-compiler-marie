import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Block, Expression } from "../../types";
import { IExpressionCompiler } from "./type";
import { EvalStrategy } from "../eval";
import { CompilationState } from "../../compilationState";

@Service()
export class BlockCompiler implements IExpressionCompiler {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState,
    private evalStrategy: EvalStrategy
  ) {}

  compile(expression: Expression): void {
    const { type, condition } = expression as Block;

    const currFunction = this.compilationState.currFunction();
    currFunction.scopes.push({ type });

    this.codegen
      .label(`${type}${currFunction.scopesCount}`)
      .clear()
      .skipIf(this.evalStrategy.evaluate(condition), "greaterThan", {
        literal: 0,
      });
  }
}
