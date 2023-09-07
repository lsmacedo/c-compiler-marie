import { TMP, evaluate } from ".";
import { Value } from "../../types";
import { declareVariable } from "../stack";
import { STACK_POINTER } from "../stack/procedures";
import {
  ASSIGN_ARRAY_VALUES,
  ASSIGN_NEXT_ARRAY_VALUE,
} from "../stack/procedures/assignArrayValues";
import { DECLARE_VARIABLE } from "../stack/procedures/declareVariable";
import { counters, marieCodeBuilder } from "../state";

export const evaluateElements = (value: Value) => {
  if (!value.elements) {
    throw new Error("Elements is undefined");
  }

  const result = `TMP_${counters.tmp++}`;
  const evaluatedValues = value.elements.map((el) => evaluate(el));

  marieCodeBuilder
    .copy({ direct: STACK_POINTER }, { direct: result })
    .jnS(ASSIGN_ARRAY_VALUES);
  evaluatedValues.forEach((el) =>
    marieCodeBuilder.load(el).jnS(ASSIGN_NEXT_ARRAY_VALUE)
  );

  marieCodeBuilder
    .comment(`Skip memory addresses used by initializer list`)
    .load({ literal: evaluatedValues.length })
    .jnS(DECLARE_VARIABLE);

  return { direct: result };
};
