import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Expression, Value, VariableAssignment } from "../../types";
import { EvalStrategy } from "../eval";
import { IExpressionCompiler } from "./type";
import { AUX, INTERMEDIATE_VARIABLE } from "../constants";
import { CompilationState } from "../../compilationState";

@Service()
export class VariableAssignmentCompiler implements IExpressionCompiler {
  constructor(
    private codegen: Codegen,
    private compilationState: CompilationState,
    private evalStrategy: EvalStrategy
  ) {}

  private useInitializerList(variable: string, value: Value): void {
    if (!value.elements) {
      return;
    }
    const elementsLength = value.elements.length;
    // Load variable address into the AC and store on TMP
    this.codegen.copy({ direct: variable }, { direct: AUX });
    // Iterate through items from initializer list
    value.elements.forEach((val, index) => {
      // For each item, load into AC and store indirectly on TMP
      this.evalStrategy.evaluate(val, "load");
      this.codegen.store({ indirect: AUX });
      // Increment TMP
      if (index < elementsLength - 1) {
        this.codegen.addValues({ direct: AUX }, { literal: 1 }, true);
      }
    });
  }

  private assignToPointerValue(expression: VariableAssignment): void {
    const ivar = this.evalStrategy.storeIntermediateVariable();
    this.codegen.copy({ indirect: expression.name }, { direct: AUX });
    return this.compileAssignment({
      ...expression,
      name: AUX,
      pointerOperation: false,
      value: { variable: ivar },
    });
  }

  private assignToArrayPosition(expression: VariableAssignment): void {
    const variableDefinition =
      this.compilationState.currFunction().variables[expression.name];
    const isPointer = !variableDefinition || variableDefinition.isPointer;
    const loadType = isPointer ? "indirect" : "direct";
    this.codegen.load({ [loadType]: expression.name });
    this.evalStrategy.evaluate(expression.arrayPosition!, "add");
    const variable = this.evalStrategy.storeIntermediateVariable();
    return this.compileAssignment({
      ...expression,
      name: variable,
      arrayPosition: undefined,
    });
  }

  private compileAssignment(expression: VariableAssignment): void {
    const { name, arrayPosition, pointerOperation, type, value } =
      expression as VariableAssignment;

    // Handle pointer
    if (pointerOperation && !type) {
      return this.assignToPointerValue(expression);
    }

    // Handle array position
    if (arrayPosition) {
      return this.assignToArrayPosition(expression);
    }

    const hasIvar =
      !!value?.variable && value.variable.startsWith(INTERMEDIATE_VARIABLE);
    if (hasIvar) {
      this.evalStrategy.evaluate(value!, "load");
    }
    this.codegen.store({ indirect: name });
  }

  compile(expression: Expression): void {
    // If expression is a value with a prefix or postfix, evaluate it
    if ("prefix" in expression || "postfix" in expression) {
      this.evalStrategy.evaluate(expression, "load");
      return;
    }
    const { name, value } = expression as VariableAssignment;
    if (!value) {
      return;
    }
    // Use initializer list
    if (value.elements && !value.isString) {
      return this.useInitializerList(name, value);
    }

    // Compile variable assignment
    this.evalStrategy.evaluate(value!, "load");
    return this.compileAssignment(expression as VariableAssignment);
  }
}
