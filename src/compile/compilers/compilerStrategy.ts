import { Expression } from "../../types";
import { BlockCompiler } from "./blockCompiler";
import { BlockEndCompiler } from "./blockEndCompiler";
import { ExpressionCompiler } from "./expressionCompiler";
import { FunctionCallCompiler } from "./functionCallCompiler";
import { FunctionDefinitionCompiler } from "./functionDefinitionCompiler";
import { ReturnCompiler } from "./returnCompiler";
import { ValueCompiler } from "./valueCompiler";
import { VariableAssignmentCompiler } from "./variableAssignmentCompiler";

export class CompilerStrategy {
  private static compilers: { [key: string]: ExpressionCompiler } = {
    functionDefinition: new FunctionDefinitionCompiler(),
    variableAssignment: new VariableAssignmentCompiler(),
    variableDeclaration: new VariableAssignmentCompiler(),
    return: new ReturnCompiler(),
    functionCall: new FunctionCallCompiler(),
    block: new BlockCompiler(),
    blockEnd: new BlockEndCompiler(),
    literal: new ValueCompiler(),
    prefix: new ValueCompiler(),
    postfix: new ValueCompiler(),
    variable: new ValueCompiler(),
  };

  static compile(expression: Expression) {
    const compiler = this.compilers[expression.expressionType];
    if (!compiler) {
      throw new Error("Invalid expression type");
    }
    return compiler.compile(expression);
  }
}
