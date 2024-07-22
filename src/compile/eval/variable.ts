import { Service } from "typedi";
import { Codegen, VariableType } from "../../marieCodegen";
import { Value } from "../../types";
import { IEval } from "./type";
import { EvalStrategy } from ".";
import { EXPRESSION_RESULT } from "./expression";

@Service()
export class VariableEval implements IEval {
  // Set manually to avoid circular dependency error with TypeDI
  private evalStrategy: EvalStrategy;

  public constructor(private codegen: Codegen) {}

  setStrategy(evalStrategy: EvalStrategy) {
    this.evalStrategy = evalStrategy;
  }

  private evaluatePrefix(prefix: Value["prefix"]): VariableType {
    if (!prefix) {
      throw new Error("Prefix is undefined");
    }

    const value = this.evalStrategy.evaluate(prefix.value);
    switch (prefix.operator) {
      case "++":
      case "--":
        this.codegen
          .load(value)
          .add({ literal: prefix.operator === "++" ? 1 : -1 })
          .store(value);
        return value;
      case "-":
        this.codegen
          .load({ literal: 0 })
          .subt(value)
          .store({ direct: EXPRESSION_RESULT });
        return { direct: EXPRESSION_RESULT };
      case "*":
        this.codegen.copy(value, { direct: EXPRESSION_RESULT });
        return { indirect: EXPRESSION_RESULT };
    }

    throw new Error("Invalid prefix type");
  }

  private evaluatePostfix(postfix: Value["postfix"]): VariableType {
    if (!postfix) {
      throw new Error("Postfix is undefined");
    }

    const value = this.evalStrategy.evaluate(postfix.value);
    this.codegen
      .copy(value, { direct: EXPRESSION_RESULT })
      .add({ literal: postfix.operator === "++" ? 1 : -1 })
      .store(value);

    return { direct: EXPRESSION_RESULT };
  }

  private evaluateVariable(value: Value): VariableType {
    return { indirect: value.variable };
  }

  evaluate(value: Value): VariableType {
    if (value.prefix) {
      return this.evaluatePrefix(value.prefix);
    }
    if (value.postfix) {
      return this.evaluatePostfix(value.postfix);
    }
    return this.evaluateVariable(value);
  }
}
