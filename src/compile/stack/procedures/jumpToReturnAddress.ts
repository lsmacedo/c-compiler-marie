import { FRAME_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const JUMP_TO_RETURN_ADDRESS = "$JumpToReturnAddress";
const SKIP = "$JumpToReturnAddressSkip";
const NEXT_FRAME = "$JumpToReturnAddressNextFrame";
const ADDRESS = "$JumpToReturnAddressAddress";

export const declareJumpToReturnAddress = () => {
  marieCodeBuilder
    .procedure(JUMP_TO_RETURN_ADDRESS)
    .store({ direct: SKIP })
    .add({ direct: FRAME_POINTER }, { literal: 1 }, NEXT_FRAME)
    .add({ indirect: NEXT_FRAME }, { direct: SKIP }, ADDRESS)
    .jumpI(ADDRESS)
    .jumpI(JUMP_TO_RETURN_ADDRESS);
};
