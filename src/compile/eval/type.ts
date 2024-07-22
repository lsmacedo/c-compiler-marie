import { VariableType } from "../../marieCodegen";
import { Value } from "../../types";

export interface IEval {
  evaluate(value: Value): VariableType;
}
