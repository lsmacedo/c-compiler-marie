import { Value } from "../../types";
import { TMP, evaluate } from "../evaluate";
import { getFunctionDefinition, marieCodeBuilder, scopes } from "../state";
import { FRAME_POINTER, STACK_POINTER } from "./procedures";
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

export const declareVariable = (name: string, arraySize?: Value) => {
  const functionName = currentFunctionName();
  if (!localVariables[functionName]) {
    localVariables[functionName] = [];
  }
  if (
    !localVariables[functionName].some((variable) => variable.name === name)
  ) {
    localVariables[functionName].push({
      name,
      arraySize: arraySize ? evaluate(arraySize) : undefined,
    });
    marieCodeBuilder
      .comment(`Declare variable ${name}`)
      .copy({ direct: STACK_POINTER }, { direct: name });
    const incrementStackBy = arraySize ? evaluate(arraySize) : { literal: 1 };
    marieCodeBuilder
      .load({ direct: STACK_POINTER })
      .add(incrementStackBy)
      .store({ direct: STACK_POINTER });
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
    .comment("Preparing for function call")
    .jnS(PUSH_TO_CALL_STACK);

  // Set parameters for function call
  const functionDefinition = getFunctionDefinition(functionName);
  functionDefinition.params.forEach((param, index) => {
    marieCodeBuilder
      .comment(`Set param ${param.name}`)
      .copy(evaluatedParams[index], { indirect: STACK_POINTER })
      .copy({ direct: STACK_POINTER }, { direct: param.name })
      .increment({ direct: STACK_POINTER });
  });

  // Call function
  marieCodeBuilder.comment("Function call").jnS(functionName).clear();

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
    marieCodeBuilder
      .comment("Skip return address")
      .increment({ direct: STACK_POINTER });
    if (variables.length) {
      marieCodeBuilder.comment(
        `Roll back local variables for ${currentFunction.name}`
      );
      variables.forEach(({ name, arraySize }) => {
        marieCodeBuilder
          .store({ direct: name })
          .add(arraySize ?? { literal: 1 })
          .store({ direct: STACK_POINTER });
      });
      marieCodeBuilder.comment("Resume function execution");
    }
  }
};

export const jumpToReturnAddress = () => {
  const currentFunction = getFunctionDefinition(currentFunctionName());
  marieCodeBuilder
    .comment("Jump to return address")
    .load({ direct: FRAME_POINTER })
    .add({ literal: 1 })
    .store({ direct: TMP })
    .load({ indirect: TMP })
    .add({ literal: currentFunction.params.length })
    .store({ direct: TMP })
    .jumpI(TMP);
};
