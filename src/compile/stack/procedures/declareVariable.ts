import { STACK_POINTER } from ".";
import { marieCodeBuilder } from "../../state";

export const DECLARE_VARIABLE = "$DeclareVariable";
const SIZE = "$DeclareVariableSize";

export const declareDeclareVariable = () => {
  marieCodeBuilder
    .procedure(DECLARE_VARIABLE)
    .store({ direct: SIZE })
    .add({ direct: STACK_POINTER }, undefined, STACK_POINTER)
    .subt({ direct: SIZE })
    .jumpI(DECLARE_VARIABLE);
};
