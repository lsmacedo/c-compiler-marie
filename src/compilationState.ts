import { Service } from "typedi";
import { Expression, Value } from "./types";

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

  currFunction() {
    return this.functions[this.currFunctionName];
  }
}
