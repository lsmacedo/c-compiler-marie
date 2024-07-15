import { marieCodeBuilder } from "../../state";
import { INCREMENT_STACK_POINTER } from "./incrementStackPointer";

export const ALLOCATE_MEMORY = "_AllocateMemory";

export const declareAllocateMemory = () => {
  marieCodeBuilder
    .procedure(ALLOCATE_MEMORY)
    .jnS(INCREMENT_STACK_POINTER)
    .subt({ literal: 1 })
    .jumpI(ALLOCATE_MEMORY);
};
