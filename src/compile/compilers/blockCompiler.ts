import { Block, Expression } from "../../types";
import { evaluate } from "../evaluate";
import { currentFunctionName } from "../stack";
import { counters, marieCodeBuilder, scopes } from "../state";
import { CompilerStrategy } from "./compilerStrategy";
import { ExpressionCompiler } from "./expressionCompiler";

export class BlockCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const { type, condition, forStatements } = expression as Block;
    scopes.unshift({
      functionName: currentFunctionName(),
      blockType: type,
      blockIndex: counters.blockCount,
    });
    if (type === "for") {
      CompilerStrategy.compile(forStatements![0]);
      scopes[0].forStatement = forStatements![1];
    }
    marieCodeBuilder
      .label(`${type}${counters.blockCount}`)
      .clear()
      .skipIf(evaluate(condition), "greaterThan", { literal: 0 })
      .jump(`end${type}${counters.blockCount}`);
    counters.blockCount++;
  }
}
