import { VariableType } from "../../marieCodeBuilder";
import { Value } from "../../types";
import { evaluateVariable } from "./variable";
import { evaluateLiteral } from "./literal";
import { evaluateElements } from "./elements";
import { evaluateFunctionCall } from "./functionCall";
import { evaluateExpression } from "./expression";

export const EVALUATE_RESULT = "$ExpressionResult";
export const TMP = "$Tmp";

export const evaluate = (value: Value): VariableType => {
  if (
    value.variable !== undefined ||
    value.prefix !== undefined ||
    value.postfix !== undefined
  ) {
    return evaluateVariable(value);
  }
  if (value.literal !== undefined) {
    return evaluateLiteral(value);
  }
  if (value.elements !== undefined) {
    return evaluateElements(value);
  }
  if (value.functionCall !== undefined) {
    return evaluateFunctionCall(value);
  }
  if (value.expression !== undefined) {
    return evaluateExpression(value);
  }
  throw new Error("Invalid value");
};
