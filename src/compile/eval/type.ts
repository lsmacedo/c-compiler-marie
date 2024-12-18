import { Value } from "../../types";

export type EvalOp = "load" | "add" | "subt" | "push";

export interface IEval {
  requiresMultipleSteps(value: Value): boolean;
  evaluate(value: Value, op: EvalOp): void;
}
