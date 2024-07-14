import { FRAME_POINTER, STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const DECREMENT_FRAME_POINTER = "_DecrementFramePointer";

export const declareDecrementFramePointer = () => {
  marieCodeBuilder
    .procedure(DECREMENT_FRAME_POINTER)
    .comment(
      "Procedure that decrements _FramePointer and stores its value into the stack pointer"
    )
    .subt({ direct: FRAME_POINTER }, { literal: 1 }, FRAME_POINTER)
    .copy({ indirect: FRAME_POINTER }, { direct: STACK_POINTER })
    .jumpI(DECREMENT_FRAME_POINTER);
};
