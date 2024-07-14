/*
Representation of this call stack implementation:

$StackPointer  --->      Top of Stack
                    ======================
                    |   Local Variables  |
$FramePointer  ---> |    Return Address  | Stack frame 2
                    |     Parameters     |
                    ======================
                    |   Local Variables  |
                    |    Return Address  | Stack frame 1
                    |     Parameters     |
                    ======================
                    |         ...        |

Memory addresses 0x001 to 0x00F are reserved for frame pointers. Each frame
pointer holds the address of a stack frame.

Memory addresses 0x011 to 0x0FF are reserved for the call stack. The stack
pointer holds the address of the next free memory address on the stack.
*/

import { marieCodeBuilder } from "../../state";

export const STACK_POINTER = "_StackPointer";
export const FRAME_POINTER = "_FramePointer";

const variables = {
  [STACK_POINTER]: 17, // Pointer to the top of call stack
  [FRAME_POINTER]: 0, // Pointer to the base of stack frame N, where N is the value of this variable
} as const;

export const initCallStack = () => {
  marieCodeBuilder.declareVariables(variables);
};
