import { Service } from "typedi";
import { Codegen, VariableType } from "../../marieCodegen";
import { Operation, Value } from "../../types";
import { IEval } from "./type";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";

export const EXPRESSION_RESULT = "_eres";

@Service()
export class ExpressionEval implements IEval {
  // Set manually to avoid circular dependency error with TypeDI
  private evalStrategy: EvalStrategy;

  public constructor(
    private codegen: Codegen,
    private compilationState: CompilationState
  ) {}

  setStrategy(evalStrategy: EvalStrategy) {
    this.evalStrategy = evalStrategy;
  }

  private evaluateSum(expression: Operation) {
    const { firstOperand, secondOperand } = expression;
    if (firstOperand.literal && secondOperand.literal) {
      return { literal: firstOperand.literal + secondOperand.literal };
    }
    const a = this.evalStrategy.evaluate(firstOperand);
    const b = this.evalStrategy.evaluate(secondOperand);
    this.codegen.addValues(a, b, false).store({ direct: EXPRESSION_RESULT });
  }

  private evaluateSubtraction(expression: Operation) {
    const { firstOperand, secondOperand } = expression;
    if (firstOperand.literal && secondOperand.literal) {
      return { literal: firstOperand.literal - secondOperand.literal };
    }
    const a = this.evalStrategy.evaluate(firstOperand);
    const b = this.evalStrategy.evaluate(secondOperand);
    this.codegen.subtValues(a, b, false).store({ direct: EXPRESSION_RESULT });
  }

  private evaluateLogicalOperation(expression: Operation) {
    const { firstOperand, operator, secondOperand } = expression;
    const a = this.evalStrategy.evaluate(firstOperand);
    const b = this.evalStrategy.evaluate(secondOperand);
    const currFunction = this.compilationState.currFunction();
    const { label } = currFunction.scopes[currFunction.scopes.length - 1];
    const endCondName = `end${label}`;

    const condition = (() => {
      if (operator === "<" || operator === "<=") {
        return "lessThan";
      }
      if (operator === "==" || operator === "!=") {
        return "equal";
      }
      return "greaterThan";
    })();

    this.codegen.load(a);
    if (operator === ">=") {
      this.codegen.add({ literal: 1 });
    }
    if (operator === "<=") {
      this.codegen.subt({ literal: 1 });
    }

    this.codegen.skipIfAc(condition, b).jump(endCondName);
  }

  evaluate(value: Value): VariableType {
    if (!value.expression) {
      throw new Error("Expression is undefined");
    }
    const { operator } = value.expression;
    switch (operator) {
      case "+":
        this.evaluateSum(value.expression);
        break;
      case "-":
        this.evaluateSubtraction(value.expression);
        break;
      case "=":
      case "!=":
      case ">":
      case "<":
      case ">=":
      case "<=":
        this.evaluateLogicalOperation(value.expression);
        break;
    }
    return { direct: EXPRESSION_RESULT };
  }
}
