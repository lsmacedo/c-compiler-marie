import { VariableType } from "../../marieCodegen";
import { Value } from "../../types";

export type EvalOp = "load" | "add" | "subt" | "push" | "store";

export interface IEval {
  requiresMultipleSteps(value: Value): boolean;
  evaluate(value: Value, op: EvalOp): void;
}
