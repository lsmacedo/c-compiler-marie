import { STACK_POINTER } from "..";
import { Codegen } from "../../marieCodegen";

export const PUSH = "_push";

export function declarePush(codegen: Codegen) {
  codegen
    .procedure(PUSH)
    .store({ indirect: STACK_POINTER })
    .addValues({ direct: STACK_POINTER }, { literal: 1 }, true)
    .jumpI(PUSH);
}
