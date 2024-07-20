import { Service } from "typedi";
import { VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { IEval } from "./type";

@Service()
export class VariableEval implements IEval {
  evaluate(value: Value): VariableType {
    return { indirect: value.variable };
  }
}
