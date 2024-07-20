import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Expression, Return } from "../../types";
import { EvalStrategy } from "../eval";
import { IExpressionCompiler } from "./type";
import { RETURN_VALUE } from "..";

@Service()
export class ReturnCompiler implements IExpressionCompiler {
  constructor(private codegen: Codegen, private evalStrategy: EvalStrategy) {}

  compile(expression: Expression): void {
    const { value } = expression as Return;
    if (!value) {
      return;
    }
    const evaluatedValue = this.evalStrategy.evaluate(value);
    this.codegen.copy(evaluatedValue, { direct: RETURN_VALUE });
  }
}
