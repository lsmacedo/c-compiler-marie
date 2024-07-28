import { Service } from "typedi";
import { Codegen, VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { EvalOp, IEval } from "./type";

@Service()
export class LiteralEval implements IEval {
  public constructor(private codegen: Codegen) {}

  requiresMultipleSteps(value: Value): boolean {
    return false;
  }

  evaluate(value: Value, op: EvalOp): void {
    this.codegen[op]({ literal: value.literal });
  }
}
