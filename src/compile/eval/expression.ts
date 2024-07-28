import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Operation, Value } from "../../types";
import { EvalOp, IEval } from "./type";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";
import { TMP } from "..";

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

  private evaluateSum(expression: Operation, op: EvalOp) {
    const { firstOperand, secondOperand } = expression;
    if (firstOperand.literal && secondOperand.literal) {
      return this.codegen[op]({
        literal: firstOperand.literal + secondOperand.literal,
      });
    }
    // Small optimization: if second operand requires multiple operands but the
    // first doesn't, prevent first operand from being memoized
    if (
      !this.evalStrategy.requiresMultipleSteps(firstOperand) &&
      this.evalStrategy.requiresMultipleSteps(secondOperand)
    ) {
      this.evalStrategy.evaluate(secondOperand, "add", () =>
        this.evalStrategy.evaluate(firstOperand, "load")
      );
      return;
    }
    this.evalStrategy.evaluate(firstOperand, "load");
    this.evalStrategy.evaluate(secondOperand, "add");
  }

  private evaluateSubtraction(expression: Operation, op: EvalOp) {
    const { firstOperand, secondOperand } = expression;
    if (firstOperand.literal && secondOperand.literal) {
      return this.codegen[op]({
        literal: firstOperand.literal - secondOperand.literal,
      });
    }
    // Small optimization: if second operand requires multiple operands but the
    // first doesn't, prevent first operand from being memoized
    if (
      !this.evalStrategy.requiresMultipleSteps(firstOperand) &&
      this.evalStrategy.requiresMultipleSteps(secondOperand)
    ) {
      this.evalStrategy.evaluate(secondOperand, "subt", () =>
        this.evalStrategy.evaluate(firstOperand, "load")
      );
      return;
    }
    this.evalStrategy.evaluate(firstOperand, "load");
    this.evalStrategy.evaluate(secondOperand, "subt");
  }

  private evaluateLogicalOperation(expression: Operation) {
    throw new Error("Not yet implemented");
  }

  evaluateForSkipcond(expression: Operation) {
    const { firstOperand, operator, secondOperand } = expression;

    if (operator === "!=") {
      throw new Error("Not yet implemented");
    }

    this.evalStrategy.evaluate(
      { expression: { firstOperand, operator: "-", secondOperand } },
      "load"
    );
    if (operator === ">=") {
      this.codegen.add({ literal: 1 });
    }
    if (operator === "<=") {
      this.codegen.subt({ literal: 1 });
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
        this.evaluateSum(value.expression, op);
        break;
      case "-":
        this.evaluateSubtraction(value.expression, op);
        break;
      case "==":
      case ">":
      case "<":
      case ">=":
      case "<=":
        this.evaluateLogicalOperation(value.expression);
        break;
      case "!=":
        throw new Error("Logical operator not yet supported");
    }
  }
}
