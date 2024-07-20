import { STACK_POINTER } from "..";
import { Codegen } from "../../marieCodegen";

export const RETURN = "_ret";
const RETURN_ADDRESS = "_radd";

export function declareReturn(codegen: Codegen) {
  codegen
    .procedure(RETURN)
    .pop({ direct: RETURN_ADDRESS })
    .subtValues({ direct: STACK_POINTER }, { literal: 2 }, true)
    .jumpI(RETURN_ADDRESS);
}
