import { Service } from "typedi";
import { VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { IEval } from "./type";
import { ExpressionEval } from "./expression";
import { FunctionCallEval } from "./functionCall";
import { LiteralEval } from "./literal";
import { VariableEval } from "./variable";

@Service()
export class EvalStrategy {
  constructor(
    private literalEval: LiteralEval,
    private variableEval: VariableEval,
    private expressionEval: ExpressionEval,
    private functionCallEval: FunctionCallEval
  ) {
    this.expressionEval.setStrategy(this);
    this.functionCallEval.setStrategy(this);
  }

  private evals: { [key: string]: IEval } = {
    literal: this.literalEval,
    variable: this.variableEval,
    expression: this.expressionEval,
    functionCall: this.functionCallEval,
  };

  evaluate(value: Value): VariableType {
    const evalType = Object.keys(this.evals).find(
      (key) => value[key as keyof Value] !== undefined
    );
    if (!evalType) {
      console.error(value);
      throw new Error("Invalid value");
    }
    return this.evals[evalType].evaluate(value);
  }
}
