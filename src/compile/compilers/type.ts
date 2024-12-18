import { Expression } from "../../types";

export interface IExpressionCompiler {
  compile(expression: Expression): void;
}
