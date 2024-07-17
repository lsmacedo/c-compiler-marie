import { STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";
import { PUSH_TO_STACK } from "./pushToStack";

export const PUSH_STRING_TO_STACK = "_PushStringToStack";
const INITIAL_ADDRESS = "_PushStringToStack_InitialAddress";
const ADDRESS = "_PushStringToStack_Address";

export const declarePushStringToStack = () => {
  marieCodeBuilder
    .procedure(PUSH_STRING_TO_STACK)
    .store({ direct: ADDRESS })
    .copy({ direct: STACK_POINTER }, { direct: INITIAL_ADDRESS })
    .label("_PushStringToStack_Loop")
    .load({ indirect: ADDRESS })
    .skipIfAc("greaterThan")
    .jump("_PushStringToStack_End")
    .jnS(PUSH_TO_STACK)
    .add({ direct: ADDRESS }, { literal: 1 }, ADDRESS)
    .jump("_PushStringToStack_Loop")
    .label("_PushStringToStack_End")
    .jnS(PUSH_TO_STACK)
    .load({ direct: INITIAL_ADDRESS })
    .jumpI(PUSH_STRING_TO_STACK);
};
