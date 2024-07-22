import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Expression, VariableAssignment } from "../../types";
import { EvalStrategy } from "../eval";
import { IExpressionCompiler } from "./type";
import { TMP } from "..";
import { CompilationState } from "../../compilationState";

@Service()
export class VariableAssignmentCompiler implements IExpressionCompiler {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState,
    private evalStrategy: EvalStrategy
  ) {}

  compile(expression: Expression): void {
    if ("prefix" in expression || "postfix" in expression) {
      this.evalStrategy.evaluate(expression);
      return;
    }
    const { name, arrayPosition, value } = expression as VariableAssignment;
    if (!value) {
      return;
    }
    const positionsToSkip = arrayPosition
      ? this.evalStrategy.evaluate(arrayPosition)
      : undefined;
    // Initializer list
    if (value.elements && !value.isString) {
      const values = value.elements.map((val) =>
        this.evalStrategy.evaluate(val)
      );
      this.codegen.copy({ direct: name }, { direct: TMP });
      values.forEach((val, index) => {
        this.codegen.copy(val, { indirect: TMP });
        if (index < values.length - 1) {
          this.codegen.addValues({ direct: TMP }, { literal: 1 }, true);
        }
      });
      return;
    }
    let result = name;
    // Insert at array position
    if (positionsToSkip) {
      // Load indirect if acessing through pointer
      const variableDefinition =
        this.compilationState.currFunction().variables[name];
      const loadType =
        !variableDefinition || variableDefinition.isPointer
          ? "indirect"
          : "direct";
      result = TMP;
      this.codegen
        .copy({ [loadType]: name }, { direct: TMP })
        .addValues({ direct: result }, positionsToSkip, true);
    }
    const evaluatedValue = this.evalStrategy.evaluate(value);
    this.codegen.copy(evaluatedValue, { indirect: result });
  }
}
