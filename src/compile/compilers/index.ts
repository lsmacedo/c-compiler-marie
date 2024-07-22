import { Service } from "typedi";
import { Expression } from "../../types";
import { BlockEndCompiler } from "./blockEnd";
import { IExpressionCompiler } from "./type";
import { FunctionCallCompiler } from "./functionCall";
import { FunctionDefinitionCompiler } from "./functionDefinition";
import { ReturnCompiler } from "./return";
import { VariableAssignmentCompiler } from "./variableAssignment";
import { BlockCompiler } from "./block";

@Service()
export class CompilerStrategy {
  constructor(
    private functionDefinitionCompiler: FunctionDefinitionCompiler,
    private variableAssignmentCompiler: VariableAssignmentCompiler,
    private returnCompiler: ReturnCompiler,
    private blockCompiler: BlockCompiler,
    private blockEndCompiler: BlockEndCompiler,
    private functionCallCompiler: FunctionCallCompiler
  ) {}

  private compilers: { [key: string]: IExpressionCompiler } = {
    functionDefinition: this.functionDefinitionCompiler,
    variableDeclaration: this.variableAssignmentCompiler,
    variableAssignment: this.variableAssignmentCompiler,
    return: this.returnCompiler,
    block: this.blockCompiler,
    blockEnd: this.blockEndCompiler,
    functionCall: this.functionCallCompiler,
  };

  compile(expression: Expression) {
    const compiler = this.compilers[expression.expressionType];
    if (!compiler) {
      throw new Error(
        `Expression of type ${expression.expressionType} is not yet supported`
      );
    }
    return compiler.compile(expression);
  }
}
