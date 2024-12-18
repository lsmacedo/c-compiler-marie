import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Operation, Value } from "../../types";
import { EvalOp, IEval } from "./type";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";
import {
  COMPARE_EQ,
  COMPARE_GT,
  COMPARE_GTE,
  COMPARE_LT,
  COMPARE_LTE,
  COMPARE_NEQ,
  COMPARE_FIRST_OPERAND,
} from "../procedures/compare";

export const EXPRESSION_RESULT = "__eres";

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
    this.evalStrategy.evaluate(firstOperand, "load");
    this.evalStrategy.evaluate(secondOperand, "add");
  }

  private evaluateSubtraction(expression: Operation) {
    const { firstOperand, secondOperand } = expression;
    this.evalStrategy.evaluate(firstOperand, "load");
    this.evalStrategy.evaluate(secondOperand, "subt");
  }

  private evaluateAnd(expression: Operation) {
    const { firstOperand, secondOperand } = expression;

    const count = this.compilationState.currFunction().relationalExpressions++;
    const falseLabelName = `__relational_${count}_false`;
    const endLabelName = `__relational_${count}_end`;

    this.evalStrategy.evaluate(firstOperand, "load");
    this.codegen.skipIfAc("greaterThan", { literal: 0 }).jump(falseLabelName);
    this.evalStrategy.evaluate(secondOperand, "load");
    this.codegen
      .skipIfAc("greaterThan", { literal: 0 })
      .jump(falseLabelName)
      .load({ literal: 1 })
      .jump(endLabelName)
      .label(falseLabelName)
      .load({ literal: 0 })
      .label(endLabelName);
  }

  private evaluateOr(expression: Operation) {
    const { firstOperand, secondOperand } = expression;

    const count = this.compilationState.currFunction().relationalExpressions++;
    const trueLabelName = `__relational_${count}_true`;
    const falseLabelName = `__relational_${count}_false`;
    const endLabelName = `__relational_${count}_end`;

    this.evalStrategy.evaluate(firstOperand, "load");
    this.codegen.skipIfAc("greaterThan", { literal: 0 }).jump(trueLabelName);
    this.evalStrategy.evaluate(secondOperand, "load");
    this.codegen
      .skipIfAc("greaterThan", { literal: 0 })
      .jump(falseLabelName)
      .label(trueLabelName)
      .load({ literal: 1 })
      .jump(endLabelName)
      .label(falseLabelName)
      .load({ literal: 0 })
      .label(endLabelName);
  }

  private evaluateLogicalOperation(expression: Operation) {
    const { firstOperand, operator, secondOperand } = expression;
    this.evalStrategy.evaluate(firstOperand, "load");
    this.codegen.store({ direct: COMPARE_FIRST_OPERAND });
    this.evalStrategy.evaluate(secondOperand, "load");
    switch (operator) {
      case "==":
        this.codegen.jnS(COMPARE_EQ);
        break;
      case "!=":
        this.codegen.jnS(COMPARE_NEQ);
        break;
      case ">":
        this.codegen.jnS(COMPARE_GT);
        break;
      case ">=":
        this.codegen.jnS(COMPARE_GTE);
        break;
      case "<":
        this.codegen.jnS(COMPARE_LT);
        break;
      case "<=":
        this.codegen.jnS(COMPARE_LTE);
        break;
      default:
        throw new Error("Invalid operator");
    }
  }

  requiresMultipleSteps(value: Value): boolean {
    return true;
  }

  evaluate(value: Value, op: EvalOp): void {
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
      case "&&":
        this.evaluateAnd(value.expression);
        break;
      case "||":
        this.evaluateOr(value.expression);
        break;
      default:
        this.evaluateLogicalOperation(value.expression);
        break;
    }
  }
}
