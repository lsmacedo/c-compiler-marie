import { Value } from "../../types";
import { TMP, evaluate } from "../evaluate";
import { getFunctionDefinition, marieCodeBuilder, scopes } from "../state";
import { STACK_POINTER } from "./procedures";
import { ALLOCATE_MEMORY } from "./procedures/allocateMemory";
import { ALLOCATE_MEMORY_ADDRESSES } from "./procedures/allocateMemoryAddresses";
import { INCREMENT_FRAME_POINTER } from "./procedures/incrementFramePointer";
import { INCREMENT_STACK_POINTER } from "./procedures/incrementStackPointer";

export const localVariables = {} as {
  [functionName: string]: {
    name: string;
    size: Value;
    isPointer: boolean;
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
  size: Value = { literal: 1 },
  isPointer = false,
  shouldAllocMemory = true
) => {
  const functionName = currentFunctionName();
  if (!localVariables[functionName]) {
    localVariables[functionName] = [];
  }
  if (
    !localVariables[functionName].some((variable) => variable.name === name)
  ) {
    localVariables[functionName].push({ name, size, isPointer });
  }

  if (!shouldAllocMemory) {
    return;
  }

  if (size.literal === 1) {
    marieCodeBuilder
      .comment(`Allocate memory for variable ${name}`)
      .jnS(ALLOCATE_MEMORY)
      .store({ direct: name });
    return;
  }
  marieCodeBuilder
    .comment(`Allocate memory for variable ${name}`)
    .load(size)
    .jnS(ALLOCATE_MEMORY_ADDRESSES)
    .store({ direct: name });
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

  // Set parameters for function call
  if (evaluatedParams.length) {
    marieCodeBuilder.comment(
      `Store parameters for function ${functionName} on stack`
    );
    evaluatedParams.forEach((param) => {
      marieCodeBuilder
        .copy(param, { indirect: STACK_POINTER })
        .jnS(INCREMENT_STACK_POINTER);
    });
  }

  // Jump to function
  marieCodeBuilder
    .comment("Increment frame pointer and jump to function")
    .jnS(INCREMENT_FRAME_POINTER)
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
      .jnS(INCREMENT_STACK_POINTER);

    if (variables.length) {
      marieCodeBuilder.comment(
        `Roll back local variables for ${currentFunction.name}`
      );
      marieCodeBuilder.load({ direct: STACK_POINTER });
      variables.forEach(({ name, size }) => {
        marieCodeBuilder.store({ direct: name }).add(size);
      });
      marieCodeBuilder.store({ direct: STACK_POINTER });
    }
  }
};
