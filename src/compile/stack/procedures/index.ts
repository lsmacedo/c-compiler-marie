/*
Representation for call stack implementation:

$StackPointer  --->      Top of Stack
                    ======================
                    |   Local Variables  |
                    |    Return Address  |
$FramePointer  ---> |     Parameters     |
                    ======================
                    |   Local Variables  |
                    |    Return Address  |
$FramePointer  ---> |     Parameters     |
                    ======================
                    |         ...        |
*/

import { marieCodeBuilder } from "../../state";

export const STACK_POINTER = "$StackPointer";
export const FRAME_POINTER = "$FramePointer";

const variables = {
  [STACK_POINTER]: 17, // Pointer to the top of call stack
  [FRAME_POINTER]: 0, // Pointer to the base of stack frame N, where N is the value of this variable
} as const;

export const initCallStack = () => {
  marieCodeBuilder.declareVariables(variables);
};
