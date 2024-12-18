import { Service } from "typedi";
import { Value } from "../../types";
import { EvalOp, IEval } from "./type";
import { ExpressionEval } from "./expression";
import { FunctionCallEval } from "./functionCall";
import { LiteralEval } from "./literal";
import { VariableEval } from "./variable";
import { CompilationState } from "../../compilationState";
import { INTERMEDIATE_VARIABLE, AUX } from "../constants";
import { Codegen } from "../../marieCodegen";
// import { StringEval } from "./string";

@Service()
export class EvalStrategy {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState,
    private literalEval: LiteralEval,
    private variableEval: VariableEval,
    private expressionEval: ExpressionEval,
    private functionCallEval: FunctionCallEval // private stringEval: StringEval
  ) {
    this.expressionEval.setStrategy(this);
    this.functionCallEval.setStrategy(this);
    this.variableEval.setStrategy(this);
    // this.stringEval.setStrategy(this);
  }

  private evals: { [key: string]: IEval } = {
    literal: this.literalEval,
    variable: this.variableEval,
    postfix: this.variableEval,
    prefix: this.variableEval,
    expression: this.expressionEval,
    functionCall: this.functionCallEval,
    // elements: this.stringEval,
  };

  requiresMultipleSteps(value: Value): boolean {
    const evalType = Object.keys(this.evals).find(
      (key) => value[key as keyof Value] !== undefined
    );
    if (!evalType) {
      console.error(value);
      throw new Error("Invalid value");
    }
    return this.evals[evalType].requiresMultipleSteps(value);
  }

  evaluate(value: Value, op: EvalOp): void {
    const evalType = Object.keys(this.evals).find(
      (key) => value[key as keyof Value] !== undefined
    );
    if (!evalType) {
      console.error(value);
      throw new Error("Invalid value");
    }
    // If loading the value requires multiple steps, store AC into intermediate
    // variable
    const requiresMultipleSteps =
      this.evals[evalType].requiresMultipleSteps(value);
    const shouldPersistAc = op !== "load" && requiresMultipleSteps;

    let ivar1: string | undefined = undefined;
    if (shouldPersistAc) {
      ivar1 = this.storeIntermediateVariable();
    }

    this.evals[evalType].evaluate(value, op);
    if (shouldPersistAc) {
      const ivar2 = this.storeIntermediateVariable();
      this.codegen.load({ indirect: ivar1 })[op]({ indirect: ivar2 });
    }
  }

  storeIntermediateVariable(): string {
    let intermediateVariable: string | undefined = undefined;
    const currFunction = this.compilationState.currFunction();
    const count = currFunction.intermediateVariablesCount++;
    intermediateVariable = `${INTERMEDIATE_VARIABLE}${count}`;
    currFunction.variables[intermediateVariable] = {
      isPointer: false,
      isArray: false,
      size: 1,
    };
    this.codegen.store({ indirect: intermediateVariable });
    return intermediateVariable;
  }
}
