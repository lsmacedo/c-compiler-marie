import { STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const PUSH_TO_STACK = "_PushToStack";

export const declarePushToStack = () => {
  marieCodeBuilder
    .procedure(PUSH_TO_STACK)
    .store({ indirect: STACK_POINTER })
    .add({ direct: STACK_POINTER }, { literal: 1 }, STACK_POINTER)
    .jumpI(PUSH_TO_STACK);
};
