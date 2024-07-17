import { evaluate } from ".";
import { Value } from "../../types";
import { STACK_POINTER } from "../stack/procedures";
import { counters, marieCodeBuilder } from "../state";
import { PUSH_TO_STACK } from "../stack/procedures/pushToStack";

export const READONLY_SEGMENT_START = 1024;

const evaluateString = (value: Value) => {
  if (!value.elements) {
    throw new Error("Elements is undefined");
  }

  const address = READONLY_SEGMENT_START + marieCodeBuilder.readonlyData.length;
  const evaluatedValues = value.elements.map((el) => evaluate(el).literal || 0);
  marieCodeBuilder.readonlyData.push(...evaluatedValues);

  return { literal: address };
};

export const evaluateElements = (value: Value) => {
  if (!value.elements) {
    throw new Error("Elements is undefined");
  }

  if (value.isString) {
    return evaluateString(value);
  }

  const result = `TMP_${counters.tmp++}`;
  const evaluatedValues = value.elements.map((el) => evaluate(el));

  marieCodeBuilder.copy({ direct: STACK_POINTER }, { direct: result });
  evaluatedValues.forEach((el) => marieCodeBuilder.load(el).jnS(PUSH_TO_STACK));

  return { direct: result };
};
