import { STACK_POINTER } from "../constants";
import { Codegen } from "../../marieCodegen";

export const PUSH = "__push";

export function declarePush(codegen: Codegen) {
  codegen
    .procedure(PUSH)
    .store({ indirect: STACK_POINTER })
    .addValues({ direct: STACK_POINTER }, { literal: 1 }, true)
    .jumpI(PUSH);
}
