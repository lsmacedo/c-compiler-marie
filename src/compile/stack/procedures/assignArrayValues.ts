import { marieCodeBuilder } from "../../state";

export const ASSIGN_ARRAY_VALUES = "$AssignArrayValues";
export const ASSIGN_NEXT_ARRAY_VALUE = "$AssignNextArrayValue";
const ADDRESS = "$AssignArrayValuesAddress";

export const declareAssignArrayValues = () => {
  marieCodeBuilder
    .procedure(ASSIGN_ARRAY_VALUES)
    .store({ direct: ADDRESS })
    .jumpI(ASSIGN_ARRAY_VALUES);
};

export const declareAssignNextArrayValue = () => {
  marieCodeBuilder
    .procedure(ASSIGN_NEXT_ARRAY_VALUE)
    .store({ indirect: ADDRESS })
    .add({ direct: ADDRESS }, { literal: 1 }, ADDRESS)
    .jumpI(ASSIGN_NEXT_ARRAY_VALUE);
};
