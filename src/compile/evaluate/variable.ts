import { EVALUATE_RESULT, TMP, evaluate } from ".";
import { Value } from "../../types";
import { getVariableDefinition } from "../stack";
import { counters, marieCodeBuilder } from "../state";

const evaluatePrefix = (prefix: Value["prefix"]) => {
  if (!prefix) {
    throw new Error("Prefix is undefined");
  }

  const evaluatedValue = evaluate(prefix.value);

  if (["++", "--"].includes(prefix.operator)) {
    marieCodeBuilder
      .load(evaluatedValue)
      .add({ literal: prefix.operator === "++" ? 1 : -1 })
      .store(evaluatedValue);
    return evaluatedValue;
  }
  if (prefix.operator === "-") {
    const responseVariable = `${EVALUATE_RESULT}${counters.fnReturnCount++}`;
    marieCodeBuilder
      .copy(evaluatedValue, { direct: TMP })
      .load({ literal: 0 })
      .subt({ direct: TMP })
      .store({ direct: responseVariable });
    return { direct: responseVariable };
  }
  if (prefix.operator === "*") {
    const responseVariable = `${EVALUATE_RESULT}${counters.fnReturnCount++}`;
    marieCodeBuilder.copy(evaluatedValue, { direct: responseVariable });
    return { indirect: responseVariable };
  }

  throw new Error("Invalid prefix type");
};

const evaluatePostfix = (postfix: Value["postfix"]) => {
  if (!postfix) {
    throw new Error("Postfix is undefined");
  }

  const responseVariable = `${EVALUATE_RESULT}${counters.fnReturnCount++}`;
  const evaluatedValue = evaluate(postfix.value);

  marieCodeBuilder
    .copy(evaluatedValue, { direct: responseVariable })
    .add({ literal: postfix.operator === "++" ? 1 : -1 })
    .store(evaluatedValue);
  return { direct: responseVariable };
};

export const evaluateVariable = (value: Value) => {
  if (value.prefix) {
    return evaluatePrefix(value.prefix);
  }

  if (value.postfix) {
    return evaluatePostfix(value.postfix);
  }

  if (value.variable === undefined) {
    throw new Error("Variable is undefined");
  }

  // If value is an array or is preceded by &, reference its address
  // instead of value
  const variableDefinition = getVariableDefinition(value.variable);
  const returnType =
    (variableDefinition?.arraySize && !value.arrayPosition) ||
    value.isAddressOperation
      ? "direct"
      : "indirect";

  let responseVariable = value.variable;

  // If a new variable is required, set it into returnVariable
  if (value.arrayPosition) {
    responseVariable = `${EVALUATE_RESULT}${counters.fnReturnCount++}`;
    marieCodeBuilder.copy(
      { direct: value.variable },
      { direct: responseVariable }
    );

    const positionsToSkip = evaluate(value.arrayPosition);
    const loadType = variableDefinition ? "direct" : "indirect";
    marieCodeBuilder
      .load({ [loadType]: responseVariable })
      .add(positionsToSkip)
      .store({ direct: responseVariable });
  }

  return { [returnType]: responseVariable };
};
