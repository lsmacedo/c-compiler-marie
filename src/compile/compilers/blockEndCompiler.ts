import { Expression } from "../../types";
import { JUMP_TO_RETURN_ADDRESS } from "../stack/procedures/jumpToReturnAddress";
import { DECREMENT_FRAME_POINTER } from "../stack/procedures/decrementFramePointer";
import { scopes, marieCodeBuilder } from "../state";
import { CompilerStrategy } from "./compilerStrategy";
import { ExpressionCompiler } from "./expressionCompiler";

export class BlockEndCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    if (!scopes[0].blockType) {
      marieCodeBuilder.jnS(DECREMENT_FRAME_POINTER);
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
