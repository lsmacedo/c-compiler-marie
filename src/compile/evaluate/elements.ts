import { EVALUATE_RESULT, TMP, evaluate } from ".";
import { Value } from "../../types";
import { declareVariable } from "../stack";
import { counters, marieCodeBuilder } from "../state";

export const evaluateElements = (value: Value) => {
  if (!value.elements) {
    throw new Error("Elements is undefined");
  }

  const response = declareVariable(
    `${EVALUATE_RESULT}${counters.fnReturnCount++}`,
    { literal: value.elements.length }
  );

  marieCodeBuilder.copy({ direct: response }, { direct: TMP });
  value.elements.forEach((el) => {
    marieCodeBuilder
      .copy(evaluate(el), { indirect: TMP })
      .increment({ direct: TMP });
  });

  return { direct: response };
};
