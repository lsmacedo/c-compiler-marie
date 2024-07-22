import { Service } from "typedi";
import { VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { IEval } from "./type";

@Service()
export class LiteralEval implements IEval {
  evaluate(value: Value): VariableType {
    return { literal: value.literal };
  }
}
