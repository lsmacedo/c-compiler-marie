import { Service } from "typedi";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";
import { Codegen } from "../../marieCodegen";
import { Value } from "../../types";
import { EvalOp, IEval } from "./type";
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

  private evaluatePrint(params: Value[]): void {
    this.evalStrategy.evaluate(params[0], "load");
    this.codegen.output();
  }

  requiresMultipleSteps(value: Value): boolean {
    return true;
  }

  evaluate(value: Value, op: EvalOp): void {
    if (!value.functionCall) {
      throw new Error("Function call is undefined");
    }

    const { name, params } = value.functionCall;

    if (name === "__print") {
      return this.evaluatePrint(params);
    }

    params.reverse().forEach((param) => {
      this.evalStrategy.evaluate(param, "load");
      this.codegen.push();
    });

    this.codegen
      .jnS(name)
      .jnS(offsetFunctionName(this.compilationState.currFunctionName));

    this.codegen.load({ direct: RETURN_VALUE });
  }
}
