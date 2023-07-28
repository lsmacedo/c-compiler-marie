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

const {
  $callStackPointer,
  $callStackAllocation,
  $callerListPointer,
  opResult,
  fnReturn,
  tmp,
} = {
  // Call stack management
  $callStackPointer: "$CallStackPointer", // Stores the address of the current item of the call stack
  $callStackAllocation: "$CallStackAllocation", // Stores the addresses of the start addresses of the stack frames
  $callerListPointer: "$CallerListPointer", // Stores the address of the current item of the caller list (a list of addresses to return after each function call)
  // Operations
  opResult: "OpResult", // Stores the result of the last operation
  fnReturn: "FnReturn", // Stores the return of the last function call
  tmp: "Tmp",
} as const;

const expressions = [] as Expression[];
const scopes = [] as string[];
const localVariables = {} as { [functionName: string]: string[] };
const currentFunctionName = () => scopes[0]?.split("#")[0];
let fnReturnCount = 0;
let conditionCount = 0;
let blockCount = 0;

const marieCodeBuilder = new Builder();

const builtInFunctions = {
  scan: () => marieCodeBuilder.input().store({ direct: fnReturn }),
  print: (params: Value[]) =>
    marieCodeBuilder.load(solveValue(params[0])).output(),
};

const performFunctionCall = (functionName: string, params: Value[]) => {
  // If it is a built-in function, call it
  const functionDefinition = expressions.find(
    (line) =>
      line.expressionType === "functionDefinition" &&
      (line as FunctionDefinition).name === functionName
  ) as FunctionDefinition;
  const builtInFunction =
    builtInFunctions[functionName as keyof typeof builtInFunctions];
  if (builtInFunction) {
    builtInFunction(params);
    return;
  }

  marieCodeBuilder
    .comment("Preparing for function call")
    .jnS("pushToCallStack");

  // Set params for function call
  params.forEach((param, index) => {
    const variableName = functionDefinition.params[index].name;
    const solvedValue = solveValue(param);
    marieCodeBuilder
      .comment(`Set param ${variableName}`)
      .copy(solvedValue, { indirect: $callStackPointer })
      .copy({ direct: $callStackPointer }, { direct: variableName })
      .increment({ direct: $callStackPointer });
  });

  // Call function
  marieCodeBuilder.comment("Function call").jnS(functionName);

  // Rollback variables after function call
  if (currentFunctionName()) {
    const currentFunction = expressions.find(
      (line) =>
        line.expressionType === "functionDefinition" &&
        (line as FunctionDefinition).name === currentFunctionName()
    ) as FunctionDefinition;
    const variables = [
      ...currentFunction.params.map((p) => p.name),
      ...(localVariables[currentFunction.name] ?? []),
    ];
    if (variables.length) {
      marieCodeBuilder
        .comment(`Rolling back variables for ${currentFunction.name}`)
        .load({ direct: $callStackPointer });
      variables.forEach((variable) => {
        marieCodeBuilder
          .store({ direct: variable })
          .add({ literal: 1 })
          .store({ direct: $callStackPointer });
      });
      marieCodeBuilder.comment("Resuming function execution");
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
      .copy({ direct: $callStackPointer }, { direct: name })
      .increment({ direct: $callStackPointer });
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
    const variableName = `${fnReturn}${fnReturnCount++}`;
    declareVariable(variableName);
    marieCodeBuilder.copy({ direct: fnReturn }, { indirect: variableName });
    return { indirect: variableName };
  }
  if (value.expression !== undefined) {
    const { firstOperand, operator, secondOperand } = value.expression;
    const a = solveValue(firstOperand);
    const b = solveValue(secondOperand);
    if (operator === "+") {
      marieCodeBuilder.load(a).add(b).store({ direct: opResult });
    }
    if (operator === "-") {
      marieCodeBuilder
        .copy(b, { direct: tmp })
        .load(a)
        .subt({ direct: tmp })
        .store({ direct: opResult });
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

      marieCodeBuilder.copy(b, { direct: tmp }).load(a);
      if (operator === ">=") {
        marieCodeBuilder.add({ literal: 1 });
      }
      if (operator === "<=") {
        marieCodeBuilder.subt({ literal: 1 });
      }

      const conditionId = `#condition${conditionCount++}`;
      marieCodeBuilder
        .subt({ direct: tmp })
        .skipIfCondition(condition)
        .jump(`${conditionId}else`)
        .copy({ literal: then }, { direct: opResult })
        .jump(`${conditionId}finally`)
        .label(`${conditionId}else`)
        .copy({ literal: otherwise }, { direct: opResult })
        .label(`${conditionId}finally`)
        .clear();
    }
    return { direct: opResult };
  }
  throw new Error("Invalid value");
};

export const compileForMarieAssemblyLanguage = (
  parsedExpressions: Expression[]
) => {
  marieCodeBuilder.declareVariables({
    // Call stack management
    $CallStackPointer: 1000, // Stores the address of the current item of the call stack
    $CallStackAllocation: 2000, // Stores the addresses of the start addresses of the stacks
    $CallerListPointer: 3000, // Stores the address of the current item of the caller list
    // Operations
    OpResult: 0, // Stores the result of the last operation
    FnReturn: 0, // Stores the return of the last function call
    Tmp: 0,
  });

  // First command should be a function call to "main"
  marieCodeBuilder.jnS("pushToCallStack").jnS("main");

  // Declare procedure pushToCallStack
  marieCodeBuilder
    .procedure("pushToCallStack")
    .increment({ direct: $callStackAllocation })
    .copy({ direct: $callStackPointer }, { indirect: $callStackAllocation })
    .increment({ direct: $callerListPointer })
    .jumpI("pushToCallStack");

  // Declare procedure popFromCallStack
  marieCodeBuilder
    .procedure("popFromCallStack")
    .decrement({ direct: $callStackAllocation })
    .copy({ indirect: $callStackAllocation }, { direct: $callStackPointer })
    .copy({ indirect: $callerListPointer }, { direct: tmp })
    .decrement({ direct: $callerListPointer })
    .skipIfEqual({ indirect: $callerListPointer }, { literal: 0 })
    .jumpI(tmp)
    .halt();

  expressions.push(...parsedExpressions);
  // Go through each expression
  expressions.forEach((line) => {
    switch (line.expressionType) {
      case "functionDefinition": {
        const { name } = line as FunctionDefinition;
        scopes.unshift(name);
        marieCodeBuilder
          .procedure(name)
          .comment("Store caller address")
          .copy({ direct: name }, { indirect: $callerListPointer });
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
          .copy(solveValue(value), { direct: fnReturn })
          .jnS("popFromCallStack");
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
        }
        scopes.shift();
        break;
      }
    }
  });

  return marieCodeBuilder.getCode();
};
