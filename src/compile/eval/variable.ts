import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Value } from "../../types";
import { EvalOp, IEval } from "./type";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";
import { TMP } from "..";

@Service()
export class VariableEval implements IEval {
  // Set manually to avoid circular dependency error with TypeDI
  private evalStrategy: EvalStrategy;

  public constructor(
    private codegen: Codegen,
    private compilationState: CompilationState
  ) {}

  setStrategy(evalStrategy: EvalStrategy) {
    this.evalStrategy = evalStrategy;
  }

  private evaluatePrefix(prefix: Value["prefix"]) {
    if (!prefix) {
      throw new Error("Prefix is undefined");
    }

    switch (prefix.operator) {
      case "++":
      case "--":
        // Load value into AC, increment/decrement and then store
        this.evalStrategy.evaluate(prefix.value, "load");
        this.codegen.add({ literal: prefix.operator === "++" ? 1 : -1 });
        this.evalStrategy.evaluate(prefix.value, "store");
        return;
      case "-":
        // Load 0 into AC and then subt value
        this.codegen.load({ literal: 0 });
        this.evalStrategy.evaluate(prefix.value, "subt");
        return;
      case "*":
        // Copy value into temporary variable and then load indirectly
        this.evalStrategy.evaluate(prefix.value, "load");
        this.codegen.store({ direct: TMP });
        this.codegen.load({ indirect: TMP });
        return;
    }

    throw new Error("Invalid prefix type");
  }

  private evaluatePostfix(postfix: Value["postfix"]) {
    if (!postfix) {
      throw new Error("Postfix is undefined");
    }
    let ivar: string | undefined = undefined;
    const requiresMultipleSteps = this.evalStrategy.requiresMultipleSteps(
      postfix.value
    );

    // Load value into AC
    // If operation requires multiple steps, store memoize it
    this.evalStrategy.evaluate(postfix.value, "load");
    if (requiresMultipleSteps) {
      ivar = this.evalStrategy.storeIntermediateVariable();
    }

    // Increment/decrement value and then store
    this.codegen.add({ literal: postfix.operator === "++" ? 1 : -1 });
    this.evalStrategy.evaluate(postfix.value, "store");

    // Load original value
    if (requiresMultipleSteps) {
      this.codegen.load({ indirect: ivar });
    } else {
      this.evalStrategy.evaluate(postfix.value, "load");
    }
  }

  private loadValue(value: Value, isPointer: boolean, op: EvalOp) {
    // If variable is not a pointer and there is no array position to skip,
    // simply load the value into the AC
    if (!value.arrayPosition) {
      return this.codegen[op]({ indirect: value.variable });
    }

    // Copy variable address into temporary variable and then load indirectly
    this.loadAddress(value, isPointer, "load");
    this.codegen.store({ direct: TMP });
    this.codegen.load({ indirect: TMP });
  }

  private loadAddress(value: Value, isPointer: boolean, op: EvalOp) {
    if (value.arrayPosition) {
      // Load variable address into AC
      const loadType = isPointer ? "indirect" : "direct";
      this.codegen.load({ [loadType]: value.variable });

      // Increment by amount of memory addresses to skip
      return this.evalStrategy.evaluate(value.arrayPosition, "add");
    }
    return this.codegen[op]({ direct: value.variable });
  }

  requiresMultipleSteps(value: Value): boolean {
    return !!(value.prefix || value.postfix || value.arrayPosition);
  }

  evaluate(value: Value, op: EvalOp): void {
    if (value.prefix) {
      return this.evaluatePrefix(value.prefix);
    }
    if (value.postfix) {
      return this.evaluatePostfix(value.postfix);
    }
    if (!value.variable) {
      throw new Error("Variable is undefined");
    }
    const variableDefinition =
      this.compilationState.currFunction().variables[value.variable];
    const isPointer = !variableDefinition || variableDefinition.isPointer;
    // If value is an array or is preceded by &, load its address into the AC,
    // otherwise load its value
    if (
      (variableDefinition?.isArray && !value.arrayPosition) ||
      value.isAddressOperation
    ) {
      this.loadAddress(value, isPointer, op);
    } else {
      this.loadValue(value, isPointer, op);
    }
  }
}
