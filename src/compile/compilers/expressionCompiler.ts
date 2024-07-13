import { Expression } from "../../types";

export interface ExpressionCompiler {
  compile(expression: Expression): void;
}
