import { Service } from "typedi";

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
      variables: { name: string }[];
      scopes: { type: string }[];
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
