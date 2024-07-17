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
import { declareIncrementStackPointer } from "./stack/procedures/incrementStackPointer";
import {
  ALLOCATE_MEMORY,
  declareAllocateMemory,
} from "./stack/procedures/allocateMemory";
import { declarePushToStack } from "./stack/procedures/pushToStack";
import { READONLY_SEGMENT_START } from "./evaluate/elements";
import { Builder } from "../marieCodeBuilder";
import {
  PUSH_STRING_TO_STACK,
  declarePushStringToStack,
} from "./stack/procedures/pushStringToStack";

const compileExpression = (expression: Expression) => {
  CompilerStrategy.compile(expression);
};

export const compileForMarieAssemblyLanguage = (
  parsedExpressions: Expression[]
) => {
  // Go through each expression
  expressions.push(...parsedExpressions);
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
    [PUSH_STRING_TO_STACK]: declarePushStringToStack,
    [DIVIDE]: declareDivide,
    [MULTIPLY]: declareMultiply,
  };
  const codeBeforeProcedures = marieCodeBuilder.getCode();
  Object.entries(procedures).forEach(([procedureName, declareProcedure]) => {
    if (codeBeforeProcedures.includes(`JnS ${procedureName}`)) {
      declareProcedure();
    }
  });

  // Small piece of code that sets up the call stack and calls the program's
  // main function
  const prologue = new Builder()
    .jnS(INCREMENT_FRAME_POINTER)
    .jnS("main")
    .clear()
    .halt();

  // Set the initial address where instructions should be stored
  const org = (
    READONLY_SEGMENT_START - prologue.getInstructionsCount()
  ).toString(16);

  // Readonly segment where string literals are stored
  const readonlySegment = marieCodeBuilder.readonlyData.length
    ? "\n" +
      marieCodeBuilder.readonlyData.map((value) => `DEC ${value}`).join("\n") +
      "\n"
    : "";

  // Program instructions
  const code = marieCodeBuilder.getCode();

  return `ORG ${org}\n\n${prologue.getCode()}${readonlySegment}\n${code}
`;
};
