import { Value } from "../../types";
import {
  currentFunctionName,
  declareVariable,
  localVariables,
  performFunctionCall,
} from "../stack";
import { ALLOCATE_MEMORY } from "../stack/procedures/allocateMemory";
import { counters, getFunctionDefinition, marieCodeBuilder } from "../state";

export const FUNCTION_RETURN_ADDRESS = "_FunctionReturnAddress";

export const evaluateFunctionCall = (value: Value) => {
  if (!value.functionCall) {
    throw new Error("Function call is undefined");
  }
  const { name, params } = value.functionCall;

  // Allocate memory on stack for the return value
  if (getFunctionDefinition(name).type !== "void") {
    const currFunction = currentFunctionName();
    if (!counters.functionCalls[currFunction]) {
      counters.functionCalls[currFunction] = 0;
    }
    const functionCallId = counters.functionCalls[currFunction]++;
    const returnVariableName = `_ReturnAddress${functionCallId}`;
    marieCodeBuilder
      .comment(`Allocate memory for return value of function ${name}`)
      .jnS(ALLOCATE_MEMORY);
    declareVariable(returnVariableName, { literal: 1 }, false, false);
    performFunctionCall(name, params);
    return { indirect: returnVariableName };
  }

  performFunctionCall(name, params);
  return { literal: 0 };
};
