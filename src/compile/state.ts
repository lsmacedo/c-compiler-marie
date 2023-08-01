import { Builder } from "../marieCodeBuilder";
import { Expression, FunctionDefinition } from "../types";

export const marieCodeBuilder = new Builder();

export const expressions = [] as Expression[];
export const scopes = [] as string[];
export const counters = {
  fnReturnCount: 0,
  conditionCount: 0,
  blockCount: 0,
};

export const getFunctionDefinition = (functionName: string) => {
  return expressions.find(
    (line) =>
      line.expressionType === "functionDefinition" &&
      (line as FunctionDefinition).name === functionName
  ) as FunctionDefinition;
};
