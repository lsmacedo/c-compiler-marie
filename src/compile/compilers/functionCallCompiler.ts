import { Expression, Value } from "../../types";
import { performFunctionCall } from "../stack";
import { ExpressionCompiler } from "./expressionCompiler";

export class FunctionCallCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const { functionCall } = expression as Value;
    if (!functionCall) {
      return;
    }
    performFunctionCall(functionCall.name, functionCall.params);
  }
}
