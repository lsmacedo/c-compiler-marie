import { Value } from "../../types";
import { TMP, evaluate } from "../evaluate";
import { getFunctionDefinition, marieCodeBuilder, scopes } from "../state";
import { FRAME_POINTER, STACK_POINTER } from "./procedures";
import {
  ASSIGN_ARRAY_VALUES,
  ASSIGN_NEXT_ARRAY_VALUE,
} from "./procedures/assignArrayValues";
import { DECLARE_VARIABLE } from "./procedures/declareVariable";
import { PUSH_TO_CALL_STACK } from "./procedures/pushToCallStack";

export const localVariables = {} as {
  [functionName: string]: {
    name: string;
    arraySize?: Value;
  }[];
};

export const currentFunctionName = () => scopes[0]?.functionName;

export const getVariableDefinition = (variableName: string) => {
  return localVariables[currentFunctionName()]?.find(
    (variable) => variable.name === variableName
  );
};

export const declareVariable = (
  name: string,
  arraySize?: Value,
  skipMemoryAlloc = false
) => {
  const functionName = currentFunctionName();
  if (!localVariables[functionName]) {
    localVariables[functionName] = [];
  }
  if (
    !localVariables[functionName].some((variable) => variable.name === name)
  ) {
    localVariables[functionName].push({ name, arraySize });
    if (!skipMemoryAlloc) {
      marieCodeBuilder
        .comment(`Allocate memory for variable ${name}`)
        .load(arraySize ?? { literal: 1 })
        .jnS(DECLARE_VARIABLE)
        .store({ direct: name });
    }
  }
  return name;
};

export const performFunctionCall = (functionName: string, params: Value[]) => {
  const builtInFunctions = {
    __scan: (params: Value[]) => {
      const param = evaluate(params[0]);
      if (param.literal) {
        marieCodeBuilder
          .copy(param, { direct: TMP })
          .input()
          .store({ indirect: TMP });
        return;
      }
      marieCodeBuilder.input().store({
        indirect: param.direct ?? param.indirect,
      });
    },
    __print: (params: Value[]) =>
      marieCodeBuilder.load(evaluate(params[0])).output(),
  };
  // If it is a built-in function, call it
  const builtInFunction =
    builtInFunctions[functionName as keyof typeof builtInFunctions];
  if (builtInFunction) {
    builtInFunction(params);
    return;
  }

  // Evaluate parameters before updating call stack, as temporary variables may
  // be declared
  const evaluatedParams = params.map((param) => evaluate(param)).reverse();

  // Update call stack
  marieCodeBuilder
    .comment("Increment frame pointer before function call")
    .add(
      { direct: STACK_POINTER },
      { literal: evaluatedParams.length },
      STACK_POINTER
    )
    .jnS(PUSH_TO_CALL_STACK);

  // Set parameters for function call
  const functionDefinition = getFunctionDefinition(functionName);
  if (evaluatedParams.length) {
    marieCodeBuilder
      .comment(`Set params for function ${functionName}`)
      .subt({ direct: STACK_POINTER }, { literal: evaluatedParams.length })
      .jnS(ASSIGN_ARRAY_VALUES);
    evaluatedParams.forEach((param, index) => {
      marieCodeBuilder
        .comment(
          `Set param ${
            functionDefinition.params[evaluatedParams.length - index - 1]
              ?.name ?? "..."
          }`
        )
        .load(param)
        .jnS(ASSIGN_NEXT_ARRAY_VALUE);
    });
  }

  // Call function
  marieCodeBuilder
    .comment(`Call function ${functionName}`)
    .jnS(functionName)
    .clear();

  // Rollback variables after function call
  if (currentFunctionName()) {
    const currentFunction = getFunctionDefinition(currentFunctionName());
    const variables = localVariables[currentFunction.name] ?? [];
    if (currentFunction.params.length) {
      marieCodeBuilder
        .comment(`Roll back params for ${currentFunction.name}`)
        .load({ direct: STACK_POINTER });
      currentFunction.params.forEach(({ name }) => {
        marieCodeBuilder.subt({ literal: 1 }).store({ direct: name });
      });
    }

    marieCodeBuilder
      .comment("Skip return address")
      .add({ direct: STACK_POINTER }, { literal: 1 }, STACK_POINTER);

    if (variables.length) {
      marieCodeBuilder.comment(
        `Roll back local variables for ${currentFunction.name}`
      );
      variables.forEach(({ name, arraySize }) => {
        marieCodeBuilder
          .store({ direct: name })
          .add(arraySize ?? { literal: 1 });
      });
      marieCodeBuilder.store({ direct: STACK_POINTER });
    }
  }
};
