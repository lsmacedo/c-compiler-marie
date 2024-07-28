import { Service } from "typedi";
import { Expression, FunctionDefinition, Value } from "./types";

@Service()
export class CompilationState {
  public currFunctionName: string = "";
  public functions: {
    [scope: string]: {
      type: string;
      parameters: {
        name: string;
        type: string;
        isPointer: boolean;
        isArray: boolean;
      }[];
      variables: {
        [name: string]: { isPointer: boolean; isArray: boolean; size: number };
      };
      scopes: { label: string; type: string; forStatements?: Expression[] }[];
      scopesCount: number;
      intermediateVariablesCount: number;
      earlyReturns: number;
      earlyReturnsRemaining: number;
    };
  } = {};

  defineFunction(
    name: string,
    type: string,
    params: FunctionDefinition["params"]
  ) {
    this.functions[name] = {
      type,
      parameters: params,
      variables: {},
      scopes: [],
      scopesCount: 0,
      intermediateVariablesCount: 0,
      earlyReturns: 0,
      earlyReturnsRemaining: 0,
    };
  }

  currFunction() {
    return this.functions[this.currFunctionName];
  }
}
