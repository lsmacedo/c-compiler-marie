import { Value } from "../../types";
import { declareVariable, performFunctionCall } from "../stack";
import { counters, marieCodeBuilder } from "../state";

export const FUNCTION_RETURN = "$FUNCTION_RETURN";

export const evaluateFunctionCall = (value: Value) => {
  if (!value.functionCall) {
    throw new Error("Function call is undefined");
  }

  const { name, params } = value.functionCall;
  performFunctionCall(name, params);
  const response = declareVariable(
    `${FUNCTION_RETURN}${counters.fnReturnCount++}`
  );
  marieCodeBuilder.copy({ direct: FUNCTION_RETURN }, { indirect: response });
  return { indirect: response };
};
