import { Service } from "typedi";
import { Codegen } from "../../marieCodegen";
import { Value } from "../../types";
import { EvalOp, IEval } from "./type";
import { EvalStrategy } from ".";
import { CompilationState } from "../../compilationState";
import { LOAD_INDIRECT } from "../procedures/loadIndirect";
import { PREFIX_DECREMENT, PREFIX_INCREMENT } from "../procedures/prefix";
import { POSTFIX_DECREMENT, POSTFIX_INCREMENT } from "../procedures/postfix";

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

  private variableIsArray(value: Value): boolean {
    if (!value.variable) {
      throw new Error("Variable is undefined");
    }
    const variableDefinition =
      this.compilationState.currFunction().variables[value.variable];
    return variableDefinition?.isArray ?? false;
  }

  private variableIsPointer(value: Value): boolean {
    if (!value.variable) {
      throw new Error("Variable is undefined");
    }
    const variableDefinition =
      this.compilationState.currFunction().variables[value.variable];
    return !variableDefinition || variableDefinition.isPointer;
  }

  private evaluatePrefix(prefix: Value["prefix"]) {
    if (!prefix) {
      throw new Error("Prefix is undefined");
    }

    switch (prefix.operator) {
      case "*":
        this.evalStrategy.evaluate(prefix.value, "load");
        this.codegen.jnS(LOAD_INDIRECT);
        return;
      case "++":
        this.loadAddress(prefix.value, "load");
        this.codegen.jnS(PREFIX_INCREMENT);
        return;
      case "--":
        this.loadAddress(prefix.value, "load");
        this.codegen.jnS(PREFIX_DECREMENT);
        return;
      case "-":
        this.evalStrategy.evaluate(
          {
            expression: {
              firstOperand: { literal: 0 },
              operator: "-",
              secondOperand: prefix.value,
            },
          },
          "load"
        );
        return;
    }

    throw new Error("Invalid prefix type");
  }

  private evaluatePostfix(postfix: Value["postfix"]) {
    if (!postfix) {
      throw new Error("Postfix is undefined");
    }

    this.loadAddress(postfix.value, "load");
    switch (postfix.operator) {
      case "++":
        this.codegen.jnS(POSTFIX_INCREMENT);
        return;
      case "--":
        this.codegen.jnS(POSTFIX_DECREMENT);
        return;
    }
  }

  private evaluateVariable(value: Value, op: EvalOp) {
    if (!value.variable) {
      throw new Error("Variable is undefined");
    }
    const isArray = this.variableIsArray(value);
    // If value is an array or is preceded by &, load its address into the AC,
    // otherwise load its value
    if ((isArray && !value.arrayPosition) || value.isAddressOperation) {
      this.loadAddress(value, op);
    } else {
      this.loadValue(value, op);
    }
  }

  private loadValue(value: Value, op: EvalOp): void {
    // If variable is not a pointer and there is no array position to skip,
    // simply load the value into the AC
    if (!value.arrayPosition) {
      this.codegen[op]({ indirect: value.variable });
      return;
    }

    // Copy variable address into temporary variable and then load indirectly
    this.loadAddress(value, "load");
    this.codegen.jnS(LOAD_INDIRECT);
  }

  private loadAddress(value: Value, op: EvalOp): void {
    if (value.arrayPosition) {
      const isPointer = this.variableIsPointer(value);

      // Load variable address into AC
      const loadType = isPointer ? "indirect" : "direct";
      this.codegen.load({ [loadType]: value.variable });

      // Increment by amount of memory addresses to skip
      return this.evalStrategy.evaluate(value.arrayPosition, "add");
    }

    if (value.prefix?.operator === "*") {
      return this.loadValue(value.prefix.value, op);
    }

    this.codegen[op]({ direct: value.variable });
    return;
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
    this.evaluateVariable(value, op);
  }
}
