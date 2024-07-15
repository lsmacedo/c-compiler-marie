import { evaluate } from ".";
import { Value } from "../../types";
import { STACK_POINTER } from "../stack/procedures";
import { ALLOCATE_MEMORY_ADDRESSES } from "../stack/procedures/allocateMemoryAddresses";
import { counters, marieCodeBuilder } from "../state";
import { PUSH_TO_STACK } from "../stack/procedures/pushToStack";

export const evaluateElements = (value: Value) => {
  if (!value.elements) {
    throw new Error("Elements is undefined");
  }

  const result = `TMP_${counters.tmp++}`;
  const evaluatedValues = value.elements.map((el) => evaluate(el));

  marieCodeBuilder.copy({ direct: STACK_POINTER }, { direct: result });
  evaluatedValues.forEach((el) => marieCodeBuilder.load(el).jnS(PUSH_TO_STACK));

  marieCodeBuilder
    .comment(`Skip memory addresses used by initializer list`)
    .load({ literal: evaluatedValues.length })
    .jnS(ALLOCATE_MEMORY_ADDRESSES);

  return { direct: result };
};
