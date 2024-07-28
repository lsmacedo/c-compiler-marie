import { Service } from "typedi";
import { Expression, Value } from "../../types";
import { EvalStrategy } from "../eval";
import { IExpressionCompiler } from "./type";

@Service()
export class FunctionCallCompiler implements IExpressionCompiler {
  public constructor(private evalStrategy: EvalStrategy) {}

  compile(expression: Expression): void {
    this.evalStrategy.evaluate(expression as Value, "load");
  }
}
