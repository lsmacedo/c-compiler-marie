import { Expression } from "../../types";
import { RETURN_TO_CALLER } from "../stack/procedures/returnToCaller";
import { scopes, marieCodeBuilder } from "../state";
import { CompilerStrategy } from "./compilerStrategy";
import { ExpressionCompiler } from "./expressionCompiler";

export class BlockEndCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    if (!scopes[0].blockType) {
      marieCodeBuilder.jnS(RETURN_TO_CALLER);
      scopes.shift();
      return;
    }
    const { blockType, blockIndex, forStatement } = scopes[0];
    if (blockType === "for") {
      CompilerStrategy.compile(forStatement!);
      marieCodeBuilder.jump(`${blockType}${blockIndex}`);
    }
    if (blockType === "while") {
      marieCodeBuilder.jump(`${blockType}${blockIndex}`);
    }
    marieCodeBuilder.label(`end${blockType}${blockIndex}`).clear();
    scopes.shift();
  }
}
