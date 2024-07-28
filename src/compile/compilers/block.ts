import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Block, Expression } from "../../types";
import { IExpressionCompiler } from "./type";
import { EvalStrategy } from "../eval";
import { CompilationState } from "../../compilationState";
import { CompilerStrategy } from ".";
import { ExpressionEval } from "../eval/expression";

@Service()
export class BlockCompiler implements IExpressionCompiler {
  // Set manually to avoid circular dependency error with TypeDI
  private compilerStrategy: CompilerStrategy;

  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState,
    private evalStrategy: EvalStrategy,
    private expressionEval: ExpressionEval
  ) {}

  setStrategy(compilerStrategy: CompilerStrategy) {
    this.compilerStrategy = compilerStrategy;
  }

  compile(expression: Expression): void {
    const { type, condition, forStatements } = expression as Block;

    const currFunction = this.compilationState.currFunction();
    const label = `${
      this.compilationState.currFunctionName
    }${type}${currFunction.scopesCount++}`;
    const endLabel = `end${label}`;

    const conditionType = (() => {
      if (!condition.expression) {
        return "equal";
      }
      const { operator } = condition.expression;
      if (operator === "<" || operator === "<=") {
        return "lessThan";
      }
      if (operator === "==" || operator === "!=") {
        return "equal";
      }
      return "greaterThan";
    })();

    currFunction.scopes.push({ label, type, forStatements });

    if (type === "for") {
      this.compilerStrategy.compile(forStatements![0]);
    }

    this.codegen.label(label).clear();
    if (
      condition.expression &&
      ["==", "!=", ">", ">=", "<", "<="].includes(condition.expression.operator)
    ) {
      this.expressionEval.evaluateForSkipcond(condition.expression);
      this.codegen.skipIfAc(conditionType).jump(endLabel);
    } else {
      this.evalStrategy.evaluate(condition, "load");
      this.codegen.skipIfAc("equal", { literal: 1 }).jump(endLabel);
    }
  }
}
