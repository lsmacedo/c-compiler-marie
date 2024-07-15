import { Expression, Return } from "../../types";
import { evaluate } from "../evaluate";
import { FUNCTION_RETURN } from "../evaluate/functionCall";
import { RETURN_TO_CALLER } from "../stack/procedures/returnToCaller";
import { marieCodeBuilder } from "../state";
import { ExpressionCompiler } from "./expressionCompiler";

export class ReturnCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const { value } = expression as Return;
    if (value !== undefined) {
      marieCodeBuilder.copy(evaluate(value), { direct: FUNCTION_RETURN });
    }
    marieCodeBuilder.jnS(RETURN_TO_CALLER);
  }
}
