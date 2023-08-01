import { EVALUATE_RESULT, TMP, evaluate } from ".";
import { Value } from "../../types";
import { declareVariable, getVariableDefinition } from "../stack";
import { counters, marieCodeBuilder } from "../state";

export const evaluateVariable = (value: Value) => {
  if (value.variable === undefined) {
    throw new Error("Variable is undefined");
  }

  marieCodeBuilder.comment(`Load variable ${value.variable}`);
  // If value is an array or is preceded by &, reference its address
  // instead of value
  const variableDefinition = getVariableDefinition(value.variable);
  const returnType =
    (variableDefinition?.arraySize && !value.arrayPosition) ||
    value.addressOperation ||
    value.postfix ||
    value.prefix === "-"
      ? "direct"
      : "indirect";

  // If a new variable is required, set it into returnVariable
  let returnVariable = value.variable;
  if (
    value.arrayPosition ||
    value.pointerOperation ||
    value.postfix ||
    value.prefix === "-"
  ) {
    const variableName = `${EVALUATE_RESULT}${counters.fnReturnCount++}`;
    declareVariable(variableName);
    returnVariable = variableName;
    marieCodeBuilder.copy({ direct: value.variable }, { direct: variableName });
  }

  // If getting array at position N, skip N items from array address
  if (value.arrayPosition) {
    const positionsToSkip = evaluate(value.arrayPosition);
    const loadType = variableDefinition ? "direct" : "indirect";
    marieCodeBuilder
      .load({ [loadType]: returnVariable })
      .add(positionsToSkip)
      .store({ direct: returnVariable });
  }

  // Apply postfix
  const unaryOperator = value.prefix || value.postfix;
  if (value.postfix) {
    marieCodeBuilder
      .copy({ indirect: returnVariable }, { direct: TMP })
      .load({ indirect: returnVariable })
      .add({ literal: unaryOperator === "++" ? 1 : -1 })
      .store({ indirect: returnVariable })
      .copy({ direct: TMP }, { direct: returnVariable });
  }

  // If using the * operator, get indirect value from pointer
  if (value.pointerOperation) {
    marieCodeBuilder.copy(
      { indirect: returnVariable },
      { direct: returnVariable }
    );
  }

  // Apply prefix
  if (value.prefix && ["++", "--"].includes(value.prefix)) {
    marieCodeBuilder
      .load({ indirect: returnVariable })
      .add({ literal: unaryOperator === "++" ? 1 : -1 })
      .store({ indirect: returnVariable });
  }
  if (value.prefix === "-") {
    marieCodeBuilder
      .copy({ indirect: returnVariable }, { direct: TMP })
      .load({ literal: 0 })
      .subt({ direct: TMP })
      .store({ direct: returnVariable });
  }

  // TODO: apply prefix before and/or after *
  return { [returnType]: returnVariable };
};
