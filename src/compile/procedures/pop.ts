import { STACK_POINTER } from "../constants";
import { Codegen } from "../../marieCodegen";

export const POP = "__pop";

export function declarePop(codegen: Codegen) {
  codegen
    .procedure(POP)
    .subtValues({ direct: STACK_POINTER }, { literal: 1 }, true)
    .load({ indirect: STACK_POINTER })
    .jumpI(POP);
}
