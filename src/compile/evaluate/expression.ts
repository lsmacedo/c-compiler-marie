import { EVALUATE_RESULT, evaluate } from ".";
import { Value } from "../../types";
import { counters, marieCodeBuilder } from "../state";
import { MATH_ARG_0, MATH_ARG_1, MATH_ARG_2, MATH_RESULT } from "./procedures";
import { DIVIDE } from "./procedures/divide";
import { MULTIPLY } from "./procedures/multiply";

export const evaluateExpression = (value: Value) => {
  if (!value.expression) {
    throw new Error("Expression is undefined");
  }

  const { firstOperand, operator, secondOperand } = value.expression;
  const a = evaluate(firstOperand);
  const b = evaluate(secondOperand);
  const result = `${EVALUATE_RESULT}${counters.expressionCount++}`;

  if (operator === "+") {
    marieCodeBuilder.comment("Sum").add(a, b, result);
  }
  if (operator === "-") {
    marieCodeBuilder.comment("Subtraction").subt(a, b, result);
  }
  if (operator === "*") {
    marieCodeBuilder
      .copy(a, { direct: MATH_ARG_0 })
      .copy(b, { direct: MATH_ARG_1 })
      .jnS(MULTIPLY)
      .copy({ direct: MATH_RESULT }, { direct: result });
    return { direct: result };
  }
  if (operator === "/") {
    marieCodeBuilder
      .copy(a, { direct: MATH_ARG_0 })
      .copy(b, { direct: MATH_ARG_1 })
      .copy({ literal: 0 }, { direct: MATH_ARG_2 })
      .jnS(DIVIDE)
      .copy({ direct: MATH_RESULT }, { direct: result });
    return { direct: result };
  }
  if (operator === "%") {
    marieCodeBuilder
      .copy(a, { direct: MATH_ARG_0 })
      .copy(b, { direct: MATH_ARG_1 })
      .copy({ literal: 1 }, { direct: MATH_ARG_2 })
      .jnS(DIVIDE)
      .copy({ direct: MATH_RESULT }, { direct: result });
    return { direct: result };
  }
  if (operator === "&&") {
    const conditionId = `#condition${counters.conditionCount++}`;
    marieCodeBuilder
      .copy({ literal: 0 }, { direct: result })
      .skipIf(a, "greaterThan", { literal: 0 })
      .jump(`${conditionId}-finally`)
      .skipIf(b, "greaterThan", { literal: 0 })
      .jump(`${conditionId}-finally`)
      .copy({ literal: 1 }, { direct: result })
      .label(`${conditionId}-finally`)
      .clear();
    return { direct: result };
  }
  if (operator === "||") {
    const conditionId = `#condition${counters.conditionCount++}`;
    marieCodeBuilder
      .copy({ literal: 1 }, { direct: result })
      .skipIf(a, "lessThan", { literal: 1 })
      .jump(`${conditionId}-finally`)
      .skipIf(b, "lessThan", { literal: 1 })
      .jump(`${conditionId}-finally`)
      .copy({ literal: 0 }, { direct: result })
      .label(`${conditionId}-finally`)
      .clear();
    return { direct: result };
  }
  if (["==", "!=", ">", "<", ">=", "<="].includes(operator)) {
    const condition = (() => {
      if (operator === "<" || operator === "<=") {
        return "lessThan";
      }
      if (operator === "==" || operator === "!=") {
        return "equal";
      }
      return "greaterThan";
    })();
    const then = operator !== "!=" ? 1 : 0;
    const otherwise = operator !== "!=" ? 0 : 1;

    marieCodeBuilder.load(a);
    if (operator === ">=") {
      marieCodeBuilder.add({ literal: 1 });
    }
    if (operator === "<=") {
      marieCodeBuilder.subt({ literal: 1 });
    }

    const counterValue = counters.conditionCount++;
    marieCodeBuilder
      .skipIfAc(condition, b)
      .jump(`else${counterValue}`)
      .label(`then${counterValue}`)
      .copy({ literal: then }, { direct: result })
      .jump(`finally${counterValue}`)
      .label(`else${counterValue}`)
      .copy({ literal: otherwise }, { direct: result })
      .label(`finally${counterValue}`)
      .clear();
  }
  return { direct: result };
};
