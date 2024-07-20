import { Service } from "typedi";
import { CompilationState } from "../../compilationState";
import { Codegen } from "../../marieCodegen";
import { Expression, VariableAssignment } from "../../types";
import { EvalStrategy } from "../eval";
import { IExpressionCompiler } from "./type";

@Service()
export class VariableAssignmentCompiler implements IExpressionCompiler {
  constructor(private codegen: Codegen, private evalStrategy: EvalStrategy) {}

  compile(expression: Expression): void {
    const { name, value } = expression as VariableAssignment;
    if (!value) {
      return;
    }
    const evaluatedValue = this.evalStrategy.evaluate(value);
    this.codegen.copy(evaluatedValue, { indirect: name });
  }
}
