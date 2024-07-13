import { Expression } from "../../types";
import { JUMP_TO_RETURN_ADDRESS } from "../stack/procedures/jumpToReturnAddress";
import { POP_FROM_CALL_STACK } from "../stack/procedures/popFromCallStack";
import { scopes, marieCodeBuilder } from "../state";
import { CompilerStrategy } from "./compilerStrategy";
import { ExpressionCompiler } from "./expressionCompiler";

export class BlockEndCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    if (!scopes[0].blockType) {
      marieCodeBuilder.jnS(POP_FROM_CALL_STACK);
      marieCodeBuilder.jnS(JUMP_TO_RETURN_ADDRESS);
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
