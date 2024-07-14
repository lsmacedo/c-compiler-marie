import { Expression, Return } from "../../types";
import { evaluate } from "../evaluate";
import { FUNCTION_RETURN } from "../evaluate/functionCall";
import { JUMP_TO_RETURN_ADDRESS } from "../stack/procedures/jumpToReturnAddress";
import { DECREMENT_FRAME_POINTER } from "../stack/procedures/decrementFramePointer";
import { marieCodeBuilder } from "../state";
import { ExpressionCompiler } from "./expressionCompiler";

export class ReturnCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const { value } = expression as Return;
    if (value !== undefined) {
      marieCodeBuilder.copy(evaluate(value), { direct: FUNCTION_RETURN });
    }
    marieCodeBuilder.jnS(DECREMENT_FRAME_POINTER);
    marieCodeBuilder.jnS(JUMP_TO_RETURN_ADDRESS);
  }
}
