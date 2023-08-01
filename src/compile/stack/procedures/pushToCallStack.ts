import { FRAME_POINTER, STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const PUSH_TO_CALL_STACK = "PushToCallStack";

export const declarePushToCallStack = () => {
  marieCodeBuilder
    .procedure(PUSH_TO_CALL_STACK)
    .increment({ direct: FRAME_POINTER })
    .copy({ direct: STACK_POINTER }, { indirect: FRAME_POINTER })
    .jumpI(PUSH_TO_CALL_STACK);
};
