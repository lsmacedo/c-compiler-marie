import { STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const INCREMENT_STACK_POINTER = "_IncrementStackPointer";

export const declareIncrementStackPointer = () => {
  marieCodeBuilder
    .procedure(INCREMENT_STACK_POINTER)
    .comment("Procedure that increments _StackPointer")
    .add({ direct: STACK_POINTER }, { literal: 1 }, STACK_POINTER)
    .jumpI(INCREMENT_STACK_POINTER);
};
