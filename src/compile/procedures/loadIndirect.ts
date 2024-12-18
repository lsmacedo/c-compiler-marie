import { Codegen } from "../../marieCodegen";

export const LOAD_INDIRECT = "__loadindirect";
const LOAD_INDIRECT_TMP = "__loadindirect_tmp";

export function declareLoadIndirect(codegen: Codegen) {
  codegen
    .procedure(LOAD_INDIRECT)
    .store({ direct: LOAD_INDIRECT_TMP })
    .load({ indirect: LOAD_INDIRECT_TMP })
    .jumpI(LOAD_INDIRECT);
}
