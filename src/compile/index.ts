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

const compileExpression = (expression: Expression) => {
  switch (expression.expressionType) {
    case "functionDefinition": {
      const { name, params } = expression as FunctionDefinition;
      scopes.unshift({ functionName: name });

      marieCodeBuilder.procedure(name);

      if (params.length) {
        marieCodeBuilder
          .comment("Store parameters addresses")
          .load({ indirect: FRAME_POINTER });
        params.forEach((param) => {
          marieCodeBuilder.subt({ literal: 1 }).store({ direct: param.name });
        });
      }

      marieCodeBuilder
        .comment("Store return address on stack frame")
        .copy({ direct: name }, { indirect: STACK_POINTER })
        .add({ direct: STACK_POINTER }, { literal: 1 }, STACK_POINTER);

      break;
    }
    case "variableDeclaration":
    case "variableAssignment": {
      const {
        type,
        pointerOperation,
        name,
        isArray,
        arraySize,
        arrayPosition,
        value,
      } = expression as VariableAssignment;
      if (type) {
        // Do not allocate memory at this point when using an initializer list,
        // as in the example: int arr[] = { 1, 2, 3 };
        const skipMemoryAlloc = value?.elements !== undefined;
        const evaluatedArraySize = arraySize ? evaluate(arraySize) : undefined;
        declareVariable(
          name,
          isArray
            ? evaluatedArraySize ?? { literal: value?.elements?.length }
            : undefined,
          skipMemoryAlloc
        );
      }
      if (value?.elements) {
        const valueVariable = evaluate(value);
        marieCodeBuilder.copy(valueVariable, { direct: name });
      }
      if (value && !value.elements) {
        marieCodeBuilder.comment(`Assign value to variable ${name}`);
        const valueVariable = evaluate(value);
        const positionsToSkip = arrayPosition
          ? evaluate(arrayPosition)
          : undefined;

        let variableName = name;
        if (
          (pointerOperation && !type) ||
          (arrayPosition && !getVariableDefinition(name))
        ) {
          variableName = `$TMP_${counters.tmp++}`;
          marieCodeBuilder.copy({ indirect: name }, { direct: variableName });
        }

        if (positionsToSkip) {
          marieCodeBuilder
            .add({ direct: variableName }, positionsToSkip, variableName)
            .copy(valueVariable, { indirect: variableName });
        } else {
          marieCodeBuilder.copy(valueVariable, { indirect: variableName });
        }
      }
      break;
    }
    case "return": {
      const { value } = expression as Return;
      if (value !== undefined) {
        marieCodeBuilder.copy(evaluate(value), { direct: FUNCTION_RETURN });
      }
      marieCodeBuilder.jnS(POP_FROM_CALL_STACK);
      marieCodeBuilder.jnS(JUMP_TO_RETURN_ADDRESS);
      break;
    }
    case "functionCall": {
      const { name, params } = expression as FunctionCall;
      performFunctionCall(name, params);
      break;
    }
    case "block": {
      const { type, condition, forStatements } = expression as Block;
      scopes.unshift({
        functionName: currentFunctionName(),
        blockType: type,
        blockIndex: counters.blockCount,
      });

      if (type === "for") {
        compileExpression(forStatements![0]);
        scopes[0].forStatement = forStatements![1];
      }

      marieCodeBuilder
        .label(`${type}${counters.blockCount}`)
        .clear()
        .skipIf(evaluate(condition), "greaterThan", { literal: 0 })
        .jump(`end${type}${counters.blockCount}`);

      counters.blockCount++;
      break;
    }
    case "blockEnd": {
      if (!scopes[0].blockType) {
        marieCodeBuilder.jnS(POP_FROM_CALL_STACK);
        marieCodeBuilder.jnS(JUMP_TO_RETURN_ADDRESS);
        scopes.shift();
        break;
      }
      const { blockType, blockIndex, forStatement } = scopes[0];
      if (blockType === "for") {
        compileExpression(forStatement!);
        marieCodeBuilder.jump(`${blockType}${blockIndex}`);
      }
      if (blockType === "while") {
        marieCodeBuilder.jump(`${blockType}${blockIndex}`);
      }
      marieCodeBuilder.label(`end${blockType}${blockIndex}`).clear();
      scopes.shift();
      break;
    }
    case "literal":
    case "prefix":
    case "postfix":
    case "variable": {
      evaluate(expression as Value);
      break;
    }
  }
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
