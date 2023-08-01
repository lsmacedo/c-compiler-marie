import { EVALUATE_RESULT, TMP, evaluate } from ".";
import { Value } from "../../types";
import { declareVariable, getVariableDefinition } from "../stack";
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
    const response = declareVariable(
      `${EVALUATE_RESULT}${counters.fnReturnCount++}`
    );
    marieCodeBuilder
      .copy(evaluatedValue, { direct: TMP })
      .load({ literal: 0 })
      .subt({ direct: TMP })
      .store({ direct: response });
    return { direct: response };
  }
  if (prefix.operator === "*") {
    const response = declareVariable(
      `${EVALUATE_RESULT}${counters.fnReturnCount++}`
    );
    marieCodeBuilder.copy(evaluatedValue, { direct: response });
    return { indirect: response };
  }

  throw new Error("Invalid prefix type");
};

const evaluatePostfix = (postfix: Value["postfix"]) => {
  if (!postfix) {
    throw new Error("Postfix is undefined");
  }

  const response = declareVariable(
    `${EVALUATE_RESULT}${counters.fnReturnCount++}`
  );
  const evaluatedValue = evaluate(postfix.value);

  marieCodeBuilder
    .copy(evaluatedValue, { direct: response })
    .add({ literal: postfix.operator === "++" ? 1 : -1 })
    .store(evaluatedValue);
  return { direct: response };
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

  marieCodeBuilder.comment(`Load variable ${value.variable}`);
  // If value is an array or is preceded by &, reference its address
  // instead of value
  const variableDefinition = getVariableDefinition(value.variable);
  const returnType =
    (variableDefinition?.arraySize && !value.arrayPosition) ||
    value.isAddressOperation
      ? "direct"
      : "indirect";

  let response = value.variable;

  // If a new variable is required, set it into returnVariable
  if (value.arrayPosition) {
    response = declareVariable(`${EVALUATE_RESULT}${counters.fnReturnCount++}`);
    marieCodeBuilder.copy({ direct: value.variable }, { direct: response });

    const positionsToSkip = evaluate(value.arrayPosition);
    const loadType = variableDefinition ? "direct" : "indirect";
    marieCodeBuilder
      .load({ [loadType]: response })
      .add(positionsToSkip)
      .store({ direct: response });
  }

  return { [returnType]: response };
};
