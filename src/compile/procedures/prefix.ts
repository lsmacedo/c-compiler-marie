import { Codegen } from "../../marieCodegen";
import { LOAD_INDIRECT } from "./loadIndirect";

export const PREFIX_INCREMENT = "__prefixincrement";
export const PREFIX_DECREMENT = "__prefixdecrement";
const PREFIX_ADDRESS = "__prefix_address";

export function declarePrefixIncrement(codegen: Codegen) {
  codegen
    .procedure(PREFIX_INCREMENT)
    .store({ direct: PREFIX_ADDRESS })
    .jnS(LOAD_INDIRECT)
    .add({ literal: 1 })
    .store({ indirect: PREFIX_ADDRESS })
    .jumpI(PREFIX_INCREMENT);
}

export function declarePrefixDecrement(codegen: Codegen) {
  codegen
    .procedure(PREFIX_DECREMENT)
    .store({ direct: PREFIX_ADDRESS })
    .jnS(LOAD_INDIRECT)
    .subt({ literal: 1 })
    .store({ indirect: PREFIX_ADDRESS })
    .jumpI(PREFIX_DECREMENT);
}
