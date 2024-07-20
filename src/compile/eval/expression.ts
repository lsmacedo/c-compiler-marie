import { Service } from "typedi";
import { Codegen, VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { IEval } from "./type";
import { EvalStrategy } from ".";

export const EXPRESSION_RESULT = "_eres";

@Service()
export class ExpressionEval implements IEval {
  // Set manually to avoid circular dependency error with TypeDI
  private evalStrategy: EvalStrategy;

  public constructor(private codegen: Codegen) {}

  setStrategy(evalStrategy: EvalStrategy) {
    this.evalStrategy = evalStrategy;
  }

  evaluate(value: Value): VariableType {
    if (!value.expression) {
      throw new Error("Expression is undefined");
    }
    const { firstOperand, operator, secondOperand } = value.expression;
    if (operator === "+") {
      if (firstOperand.literal && secondOperand.literal) {
        return { literal: firstOperand.literal + secondOperand.literal };
      }
      const a = this.evalStrategy.evaluate(firstOperand);
      const b = this.evalStrategy.evaluate(secondOperand);
      this.codegen.addValues(a, b, false).store({ direct: EXPRESSION_RESULT });
    }
    if (operator === "-") {
      if (firstOperand.literal && secondOperand.literal) {
        return { literal: firstOperand.literal - secondOperand.literal };
      }
      const a = this.evalStrategy.evaluate(firstOperand);
      const b = this.evalStrategy.evaluate(secondOperand);
      this.codegen.subtValues(a, b, false).store({ direct: EXPRESSION_RESULT });
    }
    return { direct: EXPRESSION_RESULT };
  }
}
