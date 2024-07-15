import { Expression } from "../types";
import { initCallStack } from "./stack/procedures";
import {
  INCREMENT_FRAME_POINTER,
  declareIncrementFramePointer,
} from "./stack/procedures/incrementFramePointer";
import { initMath } from "./evaluate/procedures";
import { DIVIDE, declareDivide } from "./evaluate/procedures/divide";
import { expressions, marieCodeBuilder } from "./state";
import {
  ALLOCATE_MEMORY_ADDRESSES,
  declareAllocateMemoryAddresses,
} from "./stack/procedures/allocateMemoryAddresses";
import {
  ASSIGN_ARRAY_VALUES,
  ASSIGN_NEXT_ARRAY_VALUE,
  declareAssignArrayValues,
  declareAssignNextArrayValue,
} from "./stack/procedures/assignArrayValues";
import {
  RETURN_TO_CALLER,
  declareReturnToCaller,
} from "./stack/procedures/returnToCaller";
import { MULTIPLY, declareMultiply } from "./evaluate/procedures/multiply";
import { CompilerStrategy } from "./compilers/compilerStrategy";
import {
  INCREMENT_STACK_POINTER,
  declareIncrementStackPointer,
} from "./stack/procedures/incrementStackPointer";
import {
  ALLOCATE_MEMORY,
  declareAllocateMemory,
} from "./stack/procedures/allocateMemory";
import {
  PUSH_TO_STACK,
  declarePushToStack,
} from "./stack/procedures/pushToStack";

const compileExpression = (expression: Expression) => {
  CompilerStrategy.compile(expression);
};

export const compileForMarieAssemblyLanguage = (
  parsedExpressions: Expression[]
) => {
  // First command should be a function call to "main"
  marieCodeBuilder.jnS(INCREMENT_FRAME_POINTER).jnS("main").clear().halt();

  expressions.push(...parsedExpressions);
  // Go through each expression
  expressions.forEach((line) => compileExpression(line));

  // Declare procedures
  initCallStack();
  initMath();

  declareIncrementFramePointer();
  declareIncrementStackPointer();
  declarePushToStack();

  const procedures = {
    [ALLOCATE_MEMORY]: declareAllocateMemory,
    [ALLOCATE_MEMORY_ADDRESSES]: declareAllocateMemoryAddresses,
    [ASSIGN_ARRAY_VALUES]: declareAssignArrayValues,
    [ASSIGN_NEXT_ARRAY_VALUE]: declareAssignNextArrayValue,
    [RETURN_TO_CALLER]: declareReturnToCaller,
    [DIVIDE]: declareDivide,
    [MULTIPLY]: declareMultiply,
  };
  const codeBeforeProcedures = marieCodeBuilder.getCode();
  Object.entries(procedures).forEach(([procedureName, declareProcedure]) => {
    if (codeBeforeProcedures.includes(`JnS ${procedureName}`)) {
      declareProcedure();
    }
  });

  const code = marieCodeBuilder.getCode();
  const instructionsCount = marieCodeBuilder.getInstructionsCount();
  return `ORG ${(4096 - instructionsCount).toString(16)}\n${code}`;
};
