import { Expression, Value } from "../../types";
import { evaluate } from "../evaluate";
import { ExpressionCompiler } from "./expressionCompiler";

export class ValueCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    evaluate(expression as Value);
  }
}
