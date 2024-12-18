import { Codegen } from "../../marieCodegen";
import { LOAD_INDIRECT } from "./loadIndirect";

export const POSTFIX_INCREMENT = "__postfixincrement";
export const POSTFIX_DECREMENT = "__postfixdecrement";
const POSTFIX_ADDRESS = "__postfix_address";
const POSTFIX_ORIGINAL_VALUE = "__postfix_originalvalue";

export function declarePostfixIncrement(codegen: Codegen) {
  codegen
    .procedure(POSTFIX_INCREMENT)
    .store({ direct: POSTFIX_ADDRESS })
    .jnS(LOAD_INDIRECT)
    .store({ direct: POSTFIX_ORIGINAL_VALUE })
    .add({ literal: 1 })
    .store({ indirect: POSTFIX_ADDRESS })
    .load({ direct: POSTFIX_ORIGINAL_VALUE })
    .jumpI(POSTFIX_INCREMENT);
}

export function declarePostfixDecrement(codegen: Codegen) {
  codegen
    .procedure(POSTFIX_DECREMENT)
    .store({ direct: POSTFIX_ADDRESS })
    .jnS(LOAD_INDIRECT)
    .store({ direct: POSTFIX_ORIGINAL_VALUE })
    .subt({ literal: 1 })
    .store({ indirect: POSTFIX_ADDRESS })
    .load({ direct: POSTFIX_ORIGINAL_VALUE })
    .jumpI(POSTFIX_DECREMENT);
}
