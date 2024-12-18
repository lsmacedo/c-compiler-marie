import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Block, Expression } from "../../types";
import { IExpressionCompiler } from "./type";
import { EvalStrategy } from "../eval";
import { CompilationState } from "../../compilationState";
import { CompilerStrategy } from ".";
import { ExpressionEval } from "../eval/expression";
import { scopeEndLabelName } from "../constants";

@Service()
export class BlockCompiler implements IExpressionCompiler {
  // Set manually to avoid circular dependency error with TypeDI
  private compilerStrategy: CompilerStrategy;

  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState,
    private evalStrategy: EvalStrategy
  ) {}

  setStrategy(compilerStrategy: CompilerStrategy) {
    this.compilerStrategy = compilerStrategy;
  }

  compile(expression: Expression): void {
    const { type, condition, forStatements } = expression as Block;

    const currFunction = this.compilationState.currFunction();
    const label = `${
      this.compilationState.currFunctionName
    }_${type}${currFunction.scopesCount++}`;
    const endLabel = scopeEndLabelName(label);

    currFunction.scopes.push({ label, type, forStatements });

    if (type === "for") {
      this.compilerStrategy.compile(forStatements![0]);
    }

    this.codegen.label(label).clear();
    this.evalStrategy.evaluate(condition, "load");
    this.codegen.skipIfAc("greaterThan", { literal: 0 }).jump(endLabel);
  }
}
