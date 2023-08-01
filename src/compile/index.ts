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
import {
  counters,
  expressions,
  getFunctionDefinition,
  marieCodeBuilder,
  scopes,
} from "./state";
import {
  currentFunctionName,
  declareVariable,
  getVariableDefinition,
  performFunctionCall,
} from "./stack";
import { evaluate } from "./evaluate";
import { FUNCTION_RETURN } from "./evaluate/functionCall";

const START_POSITION = 100;
const Tmp = "Tmp";

const jumpToReturnAddress = () => {
  const currentFunction = getFunctionDefinition(currentFunctionName());
  marieCodeBuilder
    .comment("Jump to return address")
    .load({ direct: FRAME_POINTER })
    .add({ literal: 1 })
    .store({ direct: Tmp })
    .load({ indirect: Tmp })
    .add({ literal: currentFunction.params.length })
    .store({ direct: Tmp })
    .jumpI(Tmp);
};

const compileExpression = (expression: Expression) => {
  switch (expression.expressionType) {
    case "functionDefinition": {
      const { name } = expression as FunctionDefinition;
      scopes.unshift(name);
      marieCodeBuilder
        .procedure(name)
        .comment("Store return address on stack frame")
        .copy({ direct: name }, { indirect: STACK_POINTER })
        .increment({ direct: STACK_POINTER });
      break;
    }
    case "variableDeclaration":
    case "variableAssignment": {
      const {
        type,
        pointerOperation,
        isArray,
        name,
        arraySize,
        arrayPosition,
        value,
      } = expression as VariableAssignment;
      if (type) {
        if (isArray) {
          if (!arraySize && !value?.elements) {
            throw new Error(`Array size missing in ${name}`);
          }
          declareVariable(
            name,
            arraySize ?? { literal: value!.elements!.length }
          );
        } else {
          declareVariable(name);
        }
      }
      if (value) {
        if (value.elements) {
          if (!type) {
            throw new Error("Assignment to expression with array type");
          }
          // TODO: allow "char str[] = { 0 };" syntax to fill array
          marieCodeBuilder.copy({ direct: name }, { direct: Tmp });
          value.elements.forEach((el) => {
            marieCodeBuilder
              .copy(evaluate(el), { indirect: Tmp })
              .increment({ direct: Tmp });
          });
          break;
        }
        const valueVariable = evaluate(value);
        const positionsToSkip = arrayPosition
          ? evaluate(arrayPosition)
          : undefined;
        marieCodeBuilder.comment(`Assign value to variable ${name}`);
        const loadType =
          pointerOperation || (arrayPosition && !getVariableDefinition(name))
            ? "indirect"
            : "direct";
        const variableName = loadType === "direct" ? name : Tmp;
        if (loadType === "indirect") {
          marieCodeBuilder.copy({ [loadType]: name }, { direct: variableName });
        }
        if (positionsToSkip) {
          marieCodeBuilder
            .load({ direct: variableName })
            .add(positionsToSkip)
            .store({ direct: Tmp })
            .copy(valueVariable, { indirect: Tmp });
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
          .comment("Store return value")
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
        .label(`#block${counters.blockCount}`)
        .clear()
        .load(evaluate(condition))
        .skipIfCondition("greaterThan")
        .jump(`#block${counters.blockCount}finally`);

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
        marieCodeBuilder.jump(`#block${index}`);
      }
      if (type === "while") {
        marieCodeBuilder.jump(`#block${index}`);
      }
      marieCodeBuilder.label(`#block${index}finally`).clear();
      scopes.shift();
      break;
    }
    case "literal":
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
  marieCodeBuilder
    .org(START_POSITION)
    .jnS(PUSH_TO_CALL_STACK)
    .jnS("main")
    .clear()
    .halt();

  // Declare procedures for call stack
  initCallStack();
  declarePushToCallStack();
  declarePopFromCallStack();

  // Declare procedures for math operations
  initMath();
  declareDivide();

  expressions.push(...parsedExpressions);
  // Go through each expression
  expressions.forEach((line) => compileExpression(line));

  return marieCodeBuilder.getCode();
};
