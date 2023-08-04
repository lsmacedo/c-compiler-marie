import { EVALUATE_RESULT, TMP, evaluate } from ".";
import { Value } from "../../types";
import { counters, marieCodeBuilder } from "../state";
import { MATH_ARG_0, MATH_ARG_1, MATH_ARG_2, MATH_RESULT } from "./procedures";
import { DIVIDE } from "./procedures/divide";

export const evaluateExpression = (value: Value) => {
  if (!value.expression) {
    throw new Error("Expression is undefined");
  }

  const { firstOperand, operator, secondOperand } = value.expression;
  const a = evaluate(firstOperand);
  const b = evaluate(secondOperand);
  if (operator === "+") {
    marieCodeBuilder.load(a).add(b).store({ direct: EVALUATE_RESULT });
  }
  if (operator === "-") {
    marieCodeBuilder
      .copy(b, { direct: TMP })
      .load(a)
      .subt({ direct: TMP })
      .store({ direct: EVALUATE_RESULT });
  }
  if (operator === "/") {
    marieCodeBuilder
      .copy(a, { direct: MATH_ARG_0 })
      .copy(b, { direct: MATH_ARG_1 })
      .copy({ literal: 0 }, { direct: MATH_ARG_2 })
      .jnS(DIVIDE);
    return { direct: MATH_RESULT };
  }
  if (operator === "%") {
    marieCodeBuilder
      .copy(a, { direct: MATH_ARG_0 })
      .copy(b, { direct: MATH_ARG_1 })
      .copy({ literal: 1 }, { direct: MATH_ARG_2 })
      .jnS(DIVIDE);
    return { direct: MATH_RESULT };
  }
  if (operator === "&&") {
    const conditionId = `#condition${counters.conditionCount++}`;
    marieCodeBuilder
      .copy({ literal: 0 }, { direct: EVALUATE_RESULT })
      .load(a)
      .skipIfCondition("greaterThan")
      .jump(`${conditionId}-finally`)
      .load(b)
      .skipIfCondition("greaterThan")
      .jump(`${conditionId}-finally`)
      .copy({ literal: 1 }, { direct: EVALUATE_RESULT })
      .label(`${conditionId}-finally`)
      .clear();
    return { direct: EVALUATE_RESULT };
  }
  if (operator === "||") {
    const conditionId = `#condition${counters.conditionCount++}`;
    marieCodeBuilder
      .copy({ literal: 1 }, { direct: EVALUATE_RESULT })
      .load(a)
      .subt({ literal: 1 })
      .skipIfCondition("lessThan")
      .jump(`${conditionId}-finally`)
      .load(b)
      .subt({ literal: 1 })
      .skipIfCondition("lessThan")
      .jump(`${conditionId}-finally`)
      .copy({ literal: 0 }, { direct: EVALUATE_RESULT })
      .label(`${conditionId}-finally`)
      .clear();
    return { direct: EVALUATE_RESULT };
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

    marieCodeBuilder.copy(b, { direct: TMP }).load(a);
    if (operator === ">=") {
      marieCodeBuilder.add({ literal: 1 });
    }
    if (operator === "<=") {
      marieCodeBuilder.subt({ literal: 1 });
    }

    const conditionId = `#condition${counters.conditionCount++}`;
    marieCodeBuilder
      .subt({ direct: TMP })
      .skipIfCondition(condition)
      .jump(`${conditionId}else`)
      .copy({ literal: then }, { direct: EVALUATE_RESULT })
      .jump(`${conditionId}finally`)
      .label(`${conditionId}else`)
      .copy({ literal: otherwise }, { direct: EVALUATE_RESULT })
      .label(`${conditionId}finally`)
      .clear();
  }
  return { direct: EVALUATE_RESULT };
};
