import { FRAME_POINTER, STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const INCREMENT_FRAME_POINTER = "_IncrementFramePointer";

export const declareIncrementFramePointer = () => {
  marieCodeBuilder
    .procedure(INCREMENT_FRAME_POINTER)
    .comment(
      "Procedure that increments _FramePointer and stores in it the address of the current stack frame"
    )
    .add({ direct: FRAME_POINTER }, { literal: 1 }, FRAME_POINTER)
    .copy({ direct: STACK_POINTER }, { indirect: FRAME_POINTER })
    .jumpI(INCREMENT_FRAME_POINTER);
};
