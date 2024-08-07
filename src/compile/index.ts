import { Expression } from "../types";
import { initCallStack } from "./stack/procedures";
import {
  PUSH_TO_CALL_STACK,
  declarePushToCallStack,
} from "./stack/procedures/pushToCallStack";
import {
  POP_FROM_CALL_STACK,
  declarePopFromCallStack,
} from "./stack/procedures/popFromCallStack";
import { initMath } from "./evaluate/procedures";
import { DIVIDE, declareDivide } from "./evaluate/procedures/divide";
import { expressions, marieCodeBuilder } from "./state";
import {
  DECLARE_VARIABLE,
  declareDeclareVariable,
} from "./stack/procedures/declareVariable";
import {
  ASSIGN_ARRAY_VALUES,
  ASSIGN_NEXT_ARRAY_VALUE,
  declareAssignArrayValues,
  declareAssignNextArrayValue,
} from "./stack/procedures/assignArrayValues";
import {
  JUMP_TO_RETURN_ADDRESS,
  declareJumpToReturnAddress,
} from "./stack/procedures/jumpToReturnAddress";
import { MULTIPLY, declareMultiply } from "./evaluate/procedures/multiply";
import { CompilerStrategy } from "./compilers/compilerStrategy";

const compileExpression = (expression: Expression) => {
  CompilerStrategy.compile(expression);
};

export const compileForMarieAssemblyLanguage = (
  parsedExpressions: Expression[]
) => {
  // First command should be a function call to "main"
  marieCodeBuilder.jnS(PUSH_TO_CALL_STACK).jnS("main").clear().halt();

  expressions.push(...parsedExpressions);
  // Go through each expression
  expressions.forEach((line) => compileExpression(line));

  // Declare procedures
  initCallStack();
  initMath();
  const procedures = {
    [PUSH_TO_CALL_STACK]: declarePushToCallStack,
    [POP_FROM_CALL_STACK]: declarePopFromCallStack,
    [DECLARE_VARIABLE]: declareDeclareVariable,
    [ASSIGN_ARRAY_VALUES]: declareAssignArrayValues,
    [ASSIGN_NEXT_ARRAY_VALUE]: declareAssignNextArrayValue,
    [JUMP_TO_RETURN_ADDRESS]: declareJumpToReturnAddress,
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
