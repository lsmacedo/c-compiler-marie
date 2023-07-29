import {
  FunctionCall,
  FunctionDefinition,
  Block,
  Expression,
  Return,
  Value,
  VariableAssignment,
} from "./types";
import { Builder, VariableType } from "./marieCodeBuilder";

/*
Representation for call stack implementation:

$StackPointer  --->      Top of Stack
                    ======================
                    |   Local Variables  |
                    |    Return Address  |
$FramePointer  ---> |     Parameters     |
                    ======================
                    |   Local Variables  |
                    |    Return Address  |
$FramePointer  ---> |     Parameters     |
                    ======================
                    |         ...        |
*/

const initialVariables = {
  // Call stack management
  $StackPointer: 1000, // Pointer to the top of call stack
  $FramePointer: 2000, // Pointer to the base of stack frame N, where N is the value of this variable
  // Operations
  OpResult: 0, // Stores the result of the last operation
  FnReturn: 0, // Stores the return of the last function call
  Tmp: 0,
} as const;

const { $StackPointer, $FramePointer, OpResult, FnReturn, Tmp } = Object.keys(
  initialVariables
).reduce(
  (acc, curr) => ({ ...acc, [curr]: curr }),
  {} as { [name: string]: string }
);

const expressions = [] as Expression[];
const scopes = [] as string[];
const localVariables = {} as { [functionName: string]: string[] };
const currentFunctionName = () => scopes[0]?.split("#")[0];
let fnReturnCount = 0;
let conditionCount = 0;
let blockCount = 0;

const marieCodeBuilder = new Builder();

const builtInFunctions = {
  scan: () => marieCodeBuilder.input().store({ direct: FnReturn }),
  print: (params: Value[]) =>
    marieCodeBuilder.load(solveValue(params[0])).output(),
};

const getFunctionByName = (functionName: string) => {
  return expressions.find(
    (line) =>
      line.expressionType === "functionDefinition" &&
      (line as FunctionDefinition).name === functionName
  ) as FunctionDefinition;
};

const performFunctionCall = (functionName: string, params: Value[]) => {
  // If it is a built-in function, call it
  const builtInFunction =
    builtInFunctions[functionName as keyof typeof builtInFunctions];
  if (builtInFunction) {
    builtInFunction(params);
    return;
  }

  marieCodeBuilder
    .comment("Preparing for function call")
    .jnS("pushToCallStack");

  const functionDefinition = getFunctionByName(functionName);

  // Set params for function call
  params.forEach((param, index) => {
    const variableName = functionDefinition.params[index].name;
    const solvedValue = solveValue(param);
    marieCodeBuilder
      .comment(`Set param ${variableName}`)
      .copy(solvedValue, { indirect: $StackPointer })
      .copy({ direct: $StackPointer }, { direct: variableName })
      .increment({ direct: $StackPointer });
  });

  // Call function
  marieCodeBuilder.comment("Function call").jnS(functionName).clear();

  // Rollback variables after function call
  if (currentFunctionName()) {
    const currentFunction = getFunctionByName(currentFunctionName());
    const variables = localVariables[currentFunction.name] ?? [];
    if (currentFunction.params.length) {
      marieCodeBuilder
        .comment(`Roll back params for ${currentFunction.name}`)
        .load({ direct: $StackPointer });
      currentFunction.params.forEach(({ name }) => {
        marieCodeBuilder
          .store({ direct: name })
          .add({ literal: 1 })
          .store({ direct: $StackPointer });
      });
    }
    marieCodeBuilder
      .comment("Skip return address")
      .increment({ direct: $StackPointer });
    if (variables.length) {
      marieCodeBuilder
        .comment(`Roll back local variables for ${currentFunction.name}`)
        .add({ literal: 1 })
        .store({ direct: $StackPointer });
      currentFunction.params.forEach(({ name }) => {
        marieCodeBuilder
          .store({ direct: name })
          .add({ literal: 1 })
          .store({ direct: $StackPointer });
      });
      marieCodeBuilder.comment("Resumefunction execution");
    }
  }
};

const declareVariable = (name: string) => {
  if (!localVariables[currentFunctionName()]) {
    localVariables[currentFunctionName()] = [];
  }
  if (!localVariables[currentFunctionName()].includes(name)) {
    localVariables[currentFunctionName()].push(name);
    marieCodeBuilder
      .comment(`Declare variable ${name}`)
      .copy({ direct: $StackPointer }, { direct: name })
      .increment({ direct: $StackPointer });
  }
};

const solveValue = (value: Value): VariableType => {
  if (value.variable !== undefined) {
    return { indirect: value.variable };
  }
  if (value.literal !== undefined) {
    return { literal: value.literal };
  }
  if (value.functionCall !== undefined) {
    const { name, params } = value.functionCall;
    performFunctionCall(name, params);
    const variableName = `${FnReturn}${fnReturnCount++}`;
    declareVariable(variableName);
    marieCodeBuilder.copy({ direct: FnReturn }, { indirect: variableName });
    return { indirect: variableName };
  }
  if (value.expression !== undefined) {
    const { firstOperand, operator, secondOperand } = value.expression;
    const a = solveValue(firstOperand);
    const b = solveValue(secondOperand);
    if (operator === "+") {
      marieCodeBuilder.load(a).add(b).store({ direct: OpResult });
    }
    if (operator === "-") {
      marieCodeBuilder
        .copy(b, { direct: Tmp })
        .load(a)
        .subt({ direct: Tmp })
        .store({ direct: OpResult });
    }
    if (operator === "*") {
      marieCodeBuilder.jnS("multiply");
    }
    if (["==", "!=", ">", "<", ">=", "<="].includes(operator)) {
      const condition = (() => {
        if (operator === "<" || operator === "<=") {
          return "lessThan";
        }
        if (operator === "==" || operator === "!=") {
          return "equal";
        }
        return "greaterThan";
      })();
      const then = operator !== "!=" ? 1 : 0;
      const otherwise = operator !== "!=" ? 0 : 1;

      marieCodeBuilder.copy(b, { direct: Tmp }).load(a);
      if (operator === ">=") {
        marieCodeBuilder.add({ literal: 1 });
      }
      if (operator === "<=") {
        marieCodeBuilder.subt({ literal: 1 });
      }

      const conditionId = `#condition${conditionCount++}`;
      marieCodeBuilder
        .subt({ direct: Tmp })
        .skipIfCondition(condition)
        .jump(`${conditionId}else`)
        .copy({ literal: then }, { direct: OpResult })
        .jump(`${conditionId}finally`)
        .label(`${conditionId}else`)
        .copy({ literal: otherwise }, { direct: OpResult })
        .label(`${conditionId}finally`)
        .clear();
    }
    return { direct: OpResult };
  }
  throw new Error("Invalid value");
};

const jumpToReturnAddress = () => {
  const currentFunction = getFunctionByName(currentFunctionName());
  marieCodeBuilder
    .comment("Jump to return address")
    .load({ direct: $FramePointer })
    .add({ literal: 1 })
    .store({ direct: Tmp })
    .load({ indirect: Tmp })
    .add({ literal: currentFunction.params.length })
    .store({ direct: Tmp })
    .jumpI(Tmp);
};

export const compileForMarieAssemblyLanguage = (
  parsedExpressions: Expression[]
) => {
  marieCodeBuilder.declareVariables(initialVariables);

  // First command should be a function call to "main"
  marieCodeBuilder.jnS("pushToCallStack").jnS("main").clear().halt();

  // Declare procedure pushToCallStack
  marieCodeBuilder
    .procedure("pushToCallStack")
    .increment({ direct: $FramePointer })
    .copy({ direct: $StackPointer }, { indirect: $FramePointer })
    .jumpI("pushToCallStack");

  // Declare procedure popFromCallStack
  marieCodeBuilder
    .procedure("popFromCallStack")
    .decrement({ direct: $FramePointer })
    .copy({ indirect: $FramePointer }, { direct: $StackPointer })
    .jumpI("popFromCallStack");

  expressions.push(...parsedExpressions);
  // Go through each expression
  expressions.forEach((line) => {
    switch (line.expressionType) {
      case "functionDefinition": {
        const { name } = line as FunctionDefinition;
        scopes.unshift(name);
        marieCodeBuilder
          .procedure(name)
          .comment("Store return address on stack frame")
          .copy({ direct: name }, { indirect: $StackPointer })
          .increment({ direct: $StackPointer });
        break;
      }
      case "variableDeclaration":
      case "variableAssignment": {
        const { type, name, value } = line as VariableAssignment;
        if (type) {
          declareVariable(name);
        }
        if (value) {
          const solvedValue = solveValue(value);
          marieCodeBuilder
            .comment(`Assign value to variable ${name}`)
            .copy(solvedValue, { indirect: name });
        }
        break;
      }
      case "return": {
        const { value } = line as Return;
        marieCodeBuilder
          .comment("Store return value")
          .copy(solveValue(value), { direct: FnReturn })
          .jnS("popFromCallStack");
        jumpToReturnAddress();
        break;
      }
      case "functionCall": {
        const { name, params } = line as FunctionCall;
        performFunctionCall(name, params);
        break;
      }
      case "block": {
        const { type, value: valueObject } = line as Block;
        scopes.unshift(`${currentFunctionName()}#${type}${blockCount}`);

        marieCodeBuilder
          .label(`#block${blockCount}`)
          .clear()
          .load(solveValue(valueObject))
          .subt({ literal: 1 })
          .skipIfCondition("equal")
          .jump(`#block${blockCount}finally`);

        blockCount++;
        break;
      }
      case "blockEnd": {
        const blockRegex = /#if|#while/g;
        if (scopes[0].match(blockRegex)) {
          const conditionIndex = scopes[0].split(blockRegex)[1];
          if (scopes[0].includes("#while")) {
            marieCodeBuilder.jump(`#block${conditionIndex}`);
          }
          marieCodeBuilder.label(`#block${conditionIndex}finally`).clear();
        } else {
          marieCodeBuilder.jnS("popFromCallStack");
          jumpToReturnAddress();
        }
        scopes.shift();
        break;
      }
    }
  });

  return marieCodeBuilder.getCode();
};
