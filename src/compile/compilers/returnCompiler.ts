import { Expression, Return } from "../../types";
import { evaluate } from "../evaluate";
import { FUNCTION_RETURN_ADDRESS } from "../evaluate/functionCall";
import { currentFunctionName } from "../stack";
import { FRAME_POINTER } from "../stack/procedures";
import { RETURN_TO_CALLER } from "../stack/procedures/returnToCaller";
import { getFunctionDefinition, marieCodeBuilder } from "../state";
import { ExpressionCompiler } from "./expressionCompiler";

export class ReturnCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const { value } = expression as Return;
    if (value !== undefined) {
      const functionDefinition = getFunctionDefinition(currentFunctionName());
      const evaluatedValue = evaluate(value);
      marieCodeBuilder
        .comment("Store return value into allocated space")
        .subt(
          { indirect: FRAME_POINTER },
          { literal: functionDefinition.params.length + 1 },
          FUNCTION_RETURN_ADDRESS
        )
        .copy(evaluatedValue, { indirect: FUNCTION_RETURN_ADDRESS });
    }
    marieCodeBuilder.jnS(RETURN_TO_CALLER);
  }
}
