import { Service } from "typedi";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";
import { Codegen, VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { IEval } from "./type";
import { RETURN_VALUE, offsetFunctionName } from "..";

@Service()
export class FunctionCallEval implements IEval {
  // Set manually to avoid circular dependency error with TypeDI
  private evalStrategy: EvalStrategy;

  public constructor(
    private compilationState: CompilationState,
    private codegen: Codegen
  ) {}

  setStrategy(evalStrategy: EvalStrategy) {
    this.evalStrategy = evalStrategy;
  }

  private evaluatePrint(params: VariableType[]): VariableType {
    this.codegen.load(params[0]).output();
    return { literal: 0 };
  }

  evaluate(value: Value): VariableType {
    if (!value.functionCall) {
      throw new Error("Function call is undefined");
    }

    const { name, params } = value.functionCall;

    const evaluatedParams = params
      .reverse()
      .map((param) => this.evalStrategy.evaluate(param));

    if (name === "__print") {
      return this.evaluatePrint(evaluatedParams);
    }

    evaluatedParams.forEach((param) => this.codegen.push(param));
    this.codegen.jnS(name).jnS(offsetFunctionName(this.compilationState.scope));

    return { direct: RETURN_VALUE };
  }
}
