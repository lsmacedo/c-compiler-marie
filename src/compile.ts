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
  ExpressionResult: 0, // Stores the result of the last operation or function return value
  Tmp: 0,
} as const;

const { $StackPointer, $FramePointer, ExpressionResult, Tmp } = Object.keys(
  initialVariables
).reduce(
  (acc, curr) => ({ ...acc, [curr]: curr }),
  {} as { [name: string]: string }
);

const expressions = [] as Expression[];
const scopes = [] as string[];
const localVariables = {} as {
  [functionName: string]: {
    name: string;
    arraySize?: Value;
  }[];
};
const currentFunctionName = () => scopes[0]?.split("#")[0];
let fnReturnCount = 0;
let conditionCount = 0;
let blockCount = 0;

const marieCodeBuilder = new Builder();

const builtInFunctions = {
  scan: () => marieCodeBuilder.input().store({ direct: ExpressionResult }),
  print: (params: Value[]) =>
    marieCodeBuilder.load(evaluate(params[0])).output(),
};

const getFunctionDefinition = (functionName: string) => {
  return expressions.find(
    (line) =>
      line.expressionType === "functionDefinition" &&
      (line as FunctionDefinition).name === functionName
  ) as FunctionDefinition;
};

const getVariableDefinition = (variableName: string) => {
  return localVariables[currentFunctionName()]?.find(
    (variable) => variable.name === variableName
  );
};

const performFunctionCall = (functionName: string, params: Value[]) => {
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
    .jnS("pushToCallStack");

  // Set parameters for function call
  const functionDefinition = getFunctionDefinition(functionName);
  functionDefinition.params.forEach((param, index) => {
    marieCodeBuilder
      .comment(`Set param ${param.name}`)
      .copy(evaluatedParams[index], { indirect: $StackPointer })
      .copy({ direct: $StackPointer }, { direct: param.name })
      .increment({ direct: $StackPointer });
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
      marieCodeBuilder.comment(
        `Roll back local variables for ${currentFunction.name}`
      );
      variables.forEach(({ name, arraySize }) => {
        marieCodeBuilder
          .store({ direct: name })
          .add(arraySize ?? { literal: 1 })
          .store({ direct: $StackPointer });
      });
      marieCodeBuilder.comment("Resume function execution");
    }
  }
};

const declareVariable = (name: string, arraySize?: Value) => {
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
      .copy({ direct: $StackPointer }, { direct: name });
    const incrementStackBy = arraySize ? evaluate(arraySize) : { literal: 1 };
    marieCodeBuilder
      .load({ direct: $StackPointer })
      .add(incrementStackBy)
      .store({ direct: $StackPointer });
  }
};

const evaluate = (value: Value): VariableType => {
  if (value.variable !== undefined) {
    marieCodeBuilder.comment(`Load variable ${value.variable}`);
    // If value is an array or is preceded by &, reference its address
    // instead of value
    const variableDefinition = getVariableDefinition(value.variable);
    const returnType =
      (variableDefinition?.arraySize && !value.arrayPosition) ||
      value.addressOperation ||
      value.postfix ||
      value.prefix === "-"
        ? "direct"
        : "indirect";

    // If a new variable is required, set it into returnVariable
    let returnVariable = value.variable;
    if (
      value.arrayPosition ||
      value.pointerOperation ||
      value.postfix ||
      value.prefix === "-"
    ) {
      const variableName = `${ExpressionResult}${fnReturnCount++}`;
      declareVariable(variableName);
      returnVariable = variableName;
      marieCodeBuilder.copy(
        { direct: value.variable },
        { direct: variableName }
      );
    }

    // If getting array at position N, skip N items from array address
    if (value.arrayPosition) {
      const positionsToSkip = evaluate(value.arrayPosition);
      const loadType = variableDefinition ? "direct" : "indirect";
      marieCodeBuilder
        .load({ [loadType]: returnVariable })
        .add(positionsToSkip)
        .store({ direct: returnVariable });
    }

    if (value.pointerOperation) {
      marieCodeBuilder.copy(
        { indirect: returnVariable },
        { direct: returnVariable }
      );
    }

    // Apply unary operators ++, -- or -
    const unaryOperator = value.prefix || value.postfix;
    if (value.prefix && ["++", "--"].includes(value.prefix)) {
      marieCodeBuilder
        .load({ indirect: returnVariable })
        .add({ literal: unaryOperator === "++" ? 1 : -1 })
        .store({ indirect: returnVariable });
    }
    if (value.prefix === "-") {
      marieCodeBuilder
        .copy({ indirect: returnVariable }, { direct: Tmp })
        .load({ literal: 0 })
        .subt({ direct: Tmp })
        .store({ direct: returnVariable });
    }
    if (value.postfix) {
      marieCodeBuilder
        .copy({ indirect: returnVariable }, { direct: Tmp })
        .load({ indirect: returnVariable })
        .add({ literal: unaryOperator === "++" ? 1 : -1 })
        .store({ indirect: returnVariable })
        .copy({ direct: Tmp }, { direct: returnVariable });
    }

    // Return
    return { [returnType]: returnVariable };
  }
  if (value.literal !== undefined) {
    marieCodeBuilder.comment(`Load literal ${value.literal}`);
    return { literal: value.literal };
  }
  if (value.functionCall !== undefined) {
    marieCodeBuilder.comment(`Load function call ${value.functionCall.name}`);
    const { name, params } = value.functionCall;
    performFunctionCall(name, params);
    const variableName = `${ExpressionResult}${fnReturnCount++}`;
    declareVariable(variableName);
    marieCodeBuilder.copy(
      { direct: ExpressionResult },
      { indirect: variableName }
    );
    return { indirect: variableName };
  }
  if (value.expression !== undefined) {
    const { firstOperand, operator, secondOperand } = value.expression;
    const a = evaluate(firstOperand);
    const b = evaluate(secondOperand);
    if (operator === "+") {
      marieCodeBuilder.load(a).add(b).store({ direct: ExpressionResult });
    }
    if (operator === "-") {
      marieCodeBuilder
        .copy(b, { direct: Tmp })
        .load(a)
        .subt({ direct: Tmp })
        .store({ direct: ExpressionResult });
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
        .copy({ literal: then }, { direct: ExpressionResult })
        .jump(`${conditionId}finally`)
        .label(`${conditionId}else`)
        .copy({ literal: otherwise }, { direct: ExpressionResult })
        .label(`${conditionId}finally`)
        .clear();
    }
    return { direct: ExpressionResult };
  }
  throw new Error("Invalid value");
};

const jumpToReturnAddress = () => {
  const currentFunction = getFunctionDefinition(currentFunctionName());
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
        const {
          type,
          pointerOperation,
          name,
          arraySize,
          arrayPosition,
          value,
        } = line as VariableAssignment;
        if (type) {
          declareVariable(name, arraySize);
        }
        if (value) {
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
            marieCodeBuilder.copy(
              { [loadType]: name },
              { direct: variableName }
            );
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
        const { value } = line as Return;
        marieCodeBuilder
          .comment("Store return value")
          .copy(evaluate(value), { direct: ExpressionResult })
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
          .load(evaluate(valueObject))
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
      case "literal":
      case "variable": {
        evaluate(line as Value);
        break;
      }
    }
  });

  return marieCodeBuilder.getCode();
};
