import { FRAME_POINTER, STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const RETURN_TO_CALLER = "_ReturnToCaller";
const ADDRESS = "_ReturnToCaller_Address";

export const declareReturnToCaller = () => {
  marieCodeBuilder
    .procedure(RETURN_TO_CALLER)
    .copy({ indirect: FRAME_POINTER }, { direct: ADDRESS })
    .subt({ direct: FRAME_POINTER }, { literal: 1 }, FRAME_POINTER)
    .copy({ indirect: FRAME_POINTER }, { direct: STACK_POINTER })
    .jumpI(ADDRESS);
};
