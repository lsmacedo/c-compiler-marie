import { STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const ALLOCATE_MEMORY_ADDRESSES = "_AllocateMemoryAddresses";
const SIZE = "_AllocateMemoryAddresses_Size";

export const declareAllocateMemoryAddresses = () => {
  marieCodeBuilder
    .procedure(ALLOCATE_MEMORY_ADDRESSES)
    .store({ direct: SIZE })
    .add({ direct: STACK_POINTER })
    .store({ direct: STACK_POINTER })
    .subt({ direct: SIZE })
    .jumpI(ALLOCATE_MEMORY_ADDRESSES);
};
