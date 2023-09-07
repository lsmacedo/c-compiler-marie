import { Value } from "../../types";
import { TMP, evaluate } from "../evaluate";
import { getFunctionDefinition, marieCodeBuilder, scopes } from "../state";
import { STACK_POINTER } from "./procedures";
import {
  ASSIGN_ARRAY_VALUES,
  ASSIGN_NEXT_ARRAY_VALUE,
} from "./procedures/assignArrayValues";
import { DECLARE_VARIABLE } from "./procedures/declareVariable";
import { JUMP_TO_RETURN_ADDRESS } from "./procedures/jumpToReturnAddress";
import { PUSH_TO_CALL_STACK } from "./procedures/pushToCallStack";

export const localVariables = {} as {
  [functionName: string]: {
    name: string;
    arraySize?: Value;
  }[];
};

export const currentFunctionName = () => scopes[0]?.split("#")[0];

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
    scan: (params: Value[]) => {
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
    print: (params: Value[]) =>
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
  const evaluatedParams = params.map((param) => evaluate(param));

  // Update call stack
  marieCodeBuilder
    .comment("Increment frame pointer before function call")
    .jnS(PUSH_TO_CALL_STACK);

  // Set parameters for function call
  const functionDefinition = getFunctionDefinition(functionName);
  if (functionDefinition.params.length) {
    marieCodeBuilder
      .comment(`Set params for function ${functionName}`)
      .load({ direct: STACK_POINTER })
      .jnS(ASSIGN_ARRAY_VALUES);
  }
  functionDefinition.params.forEach((param, index) => {
    marieCodeBuilder
      .comment(`Set param ${param.name}`)
      .load(evaluatedParams[index])
      .jnS(ASSIGN_NEXT_ARRAY_VALUE);
  });
  if (functionDefinition.params.length) {
    marieCodeBuilder.store({ direct: STACK_POINTER });
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
        marieCodeBuilder
          .store({ direct: name })
          .add({ literal: 1 })
          .store({ direct: STACK_POINTER });
      });
    }

    marieCodeBuilder.add(
      { direct: STACK_POINTER },
      { literal: 1 },
      STACK_POINTER
    );
    if (variables.length) {
      marieCodeBuilder.comment(
        `Roll back local variables for ${currentFunction.name}`
      );
      variables.forEach(({ name, arraySize }) => {
        marieCodeBuilder
          .store({ direct: name })
          .add(arraySize ?? { literal: 1 }, undefined, STACK_POINTER);
      });
    }
  }
};

export const jumpToReturnAddress = () => {
  const currentFunction = getFunctionDefinition(currentFunctionName());
  marieCodeBuilder
    .load({ literal: currentFunction.params.length })
    .jnS(JUMP_TO_RETURN_ADDRESS);
};
