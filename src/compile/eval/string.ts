import { Service } from "typedi";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";
import { Codegen, VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { IEval } from "./type";
import { STACK_POINTER } from "..";
import { EXPRESSION_RESULT } from "./expression";

@Service()
export class StringEval implements IEval {
  // Set manually to avoid circular dependency error with TypeDI
  private evalStrategy: EvalStrategy;

  public constructor(
    private compilationState: CompilationState,
    private codegen: Codegen
  ) {}

  setStrategy(evalStrategy: EvalStrategy) {
    this.evalStrategy = evalStrategy;
  }

  evaluate(value: Value): VariableType {
    if (!value.elements) {
      throw new Error("Elements is undefined");
    }

    throw new Error("Not yet implemented");
  }
}
