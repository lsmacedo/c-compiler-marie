import { STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const STORE_RETURN_ADDRESS = "$StoreReturnAddress";

export const declareStoreReturnAddress = () => {
  marieCodeBuilder
    .procedure(STORE_RETURN_ADDRESS)
    .store({ indirect: STACK_POINTER })
    .add({ direct: STACK_POINTER }, { literal: 1 }, STACK_POINTER)
    .jumpI(STORE_RETURN_ADDRESS);
};
