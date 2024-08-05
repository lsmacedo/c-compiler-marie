import { Service } from "typedi";
import { prologueFunctionName } from "../constants";
import { Codegen } from "../../marieCodegen";
import { Expression, FunctionDefinition } from "../../types";
import { IExpressionCompiler } from "./type";
import { CompilationState } from "../../compilationState";

@Service()
export class FunctionDefinitionCompiler implements IExpressionCompiler {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState
  ) {}

  compile(expression: Expression): void {
    const { name, params } = expression as FunctionDefinition;

    const localVariables = Object.entries(
      this.compilationState.functions[name].variables
    );

    // Set current scope
    this.compilationState.currFunctionName = name;

    // Function definition
    this.codegen.procedure(name).jnS(prologueFunctionName(name));
  }
}
