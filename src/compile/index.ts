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
  jumpToReturnAddress,
  performFunctionCall,
} from "./stack";
import { TMP, evaluate } from "./evaluate";
import { FUNCTION_RETURN } from "./evaluate/functionCall";
import { declareDeclareVariable } from "./stack/procedures/declareVariable";
import {
  STORE_RETURN_ADDRESS,
  declareStoreReturnAddress,
} from "./stack/procedures/storeReturnAddress";
import {
  declareAssignArrayValues,
  declareAssignNextArrayValue,
} from "./stack/procedures/assignArrayValues";
import { declareJumpToReturnAddress } from "./stack/procedures/jumpToReturnAddress";
import { declareMultiply } from "./evaluate/procedures/multiply";

const compileExpression = (expression: Expression) => {
  switch (expression.expressionType) {
    case "functionDefinition": {
      const { name, params } = expression as FunctionDefinition;
      scopes.unshift(name);
      marieCodeBuilder.procedure(name);

      if (params.length) {
        marieCodeBuilder.load({ indirect: FRAME_POINTER });
        params.forEach((param) => {
          marieCodeBuilder
            .comment(`Set function param ${param.name}`)
            .store({ direct: param.name })
            .add({ literal: 1 })
            .store({ direct: STACK_POINTER });
        });
      }

      marieCodeBuilder
        .comment("Store return address on stack frame")
        .load({ direct: name })
        .jnS(STORE_RETURN_ADDRESS);
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
        marieCodeBuilder
          .copy(evaluate(value), { direct: FUNCTION_RETURN })
          .jnS(POP_FROM_CALL_STACK);
      }
      jumpToReturnAddress();
      break;
    }
    case "functionCall": {
      const { name, params } = expression as FunctionCall;
      performFunctionCall(name, params);
      break;
    }
    case "block": {
      const { type, condition, forStatements } = expression as Block;
      scopes.unshift(`${currentFunctionName()}#${type}#${counters.blockCount}`);

      if (type === "for") {
        compileExpression(forStatements![0]);
        scopes[0] += `#${JSON.stringify(forStatements![1])}`;
      }

      marieCodeBuilder
        .label(`${type}Block${counters.blockCount}`)
        .clear()
        .skipIf(evaluate(condition), "greaterThan", { literal: 0 })
        .jump(`${type}BlockEnd${counters.blockCount}`);

      counters.blockCount++;
      break;
    }
    case "blockEnd": {
      if (!scopes[0].includes("#")) {
        marieCodeBuilder.jnS(POP_FROM_CALL_STACK);
        jumpToReturnAddress();
        scopes.shift();
        break;
      }
      const [_, type, index, forStatement] = scopes[0].split("#");
      if (type === "for") {
        compileExpression(JSON.parse(forStatement) as Expression);
        marieCodeBuilder.jump(`${type}Block${index}`);
      }
      if (type === "while") {
        marieCodeBuilder.jump(`${type}Block${index}`);
      }
      marieCodeBuilder.label(`${type}BlockEnd${index}`).clear();
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
  declareStoreReturnAddress();
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
