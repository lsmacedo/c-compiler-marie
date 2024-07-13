import {
  FunctionCall,
  FunctionDefinition,
  Block,
  Expression,
  Return,
  Value,
  VariableAssignment,
} from "../types";
import {
  FRAME_POINTER,
  STACK_POINTER,
  initCallStack,
} from "./stack/procedures";
import {
  PUSH_TO_CALL_STACK,
  declarePushToCallStack,
} from "./stack/procedures/pushToCallStack";
import {
  POP_FROM_CALL_STACK,
  declarePopFromCallStack,
} from "./stack/procedures/popFromCallStack";
import { initMath } from "./evaluate/procedures";
import { declareDivide } from "./evaluate/procedures/divide";
import { counters, expressions, marieCodeBuilder, scopes } from "./state";
import {
  currentFunctionName,
  declareVariable,
  getVariableDefinition,
  performFunctionCall,
} from "./stack";
import { evaluate } from "./evaluate";
import { FUNCTION_RETURN } from "./evaluate/functionCall";
import { declareDeclareVariable } from "./stack/procedures/declareVariable";
import {
  declareAssignArrayValues,
  declareAssignNextArrayValue,
} from "./stack/procedures/assignArrayValues";
import {
  JUMP_TO_RETURN_ADDRESS,
  declareJumpToReturnAddress,
} from "./stack/procedures/jumpToReturnAddress";
import { declareMultiply } from "./evaluate/procedures/multiply";
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

  // Declare procedures for call stack
  initCallStack();
  declarePushToCallStack();
  declarePopFromCallStack();
  declareDeclareVariable();
  declareAssignArrayValues();
  declareAssignNextArrayValue();
  declareJumpToReturnAddress();

  // Declare procedures for math operations
  initMath();
  declareDivide();
  declareMultiply();

  const code = marieCodeBuilder.getCode();
  const instructionsCount = marieCodeBuilder.getInstructionsCount();
  return `ORG ${(4096 - instructionsCount).toString(16)}\n${code}`;
};
