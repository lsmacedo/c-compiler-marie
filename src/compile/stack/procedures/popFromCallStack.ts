import { FRAME_POINTER, STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const POP_FROM_CALL_STACK = "PopFromCallStack";

export const declarePopFromCallStack = () => {
  marieCodeBuilder
    .procedure(POP_FROM_CALL_STACK)
    .decrement({ direct: FRAME_POINTER })
    .copy({ indirect: FRAME_POINTER }, { direct: STACK_POINTER })
    .jumpI(POP_FROM_CALL_STACK);
};
