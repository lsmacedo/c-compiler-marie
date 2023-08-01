import { MATH_ARG_0, MATH_ARG_1, MATH_ARG_2, MATH_RESULT } from ".";
import { marieCodeBuilder } from "../../state";

export const DIVIDE = "Divide";

const K = "$DIVIDE_K";
const POW = "$DIVIDE_POW";
const QUOTIENT = "$DIVIDE_QUOTIENT";
const REMAINDER = "$DIVIDE_REMAINDER";

export const declareDivide = () => {
  // Declare procedure divide
  marieCodeBuilder
    .procedure(DIVIDE)
    .copy({ literal: 0 }, { direct: QUOTIENT })
    .copy({ direct: MATH_ARG_0 }, { direct: K })
    // Outer
    .label("DivOuter")
    .load({ direct: K })
    .skipIfCondition("greaterThan")
    .jump("DivDone")
    .load({ literal: 1 })
    .store({ direct: POW })
    .copy({ direct: MATH_ARG_1 }, { direct: REMAINDER })
    // Inner
    .label("DivInner")
    .load({ direct: REMAINDER })
    .add({ direct: REMAINDER })
    .subt({ direct: K })
    .skipIfCondition("lessThan")
    .jump("DivAftIn")
    .load({ direct: REMAINDER })
    .add({ direct: REMAINDER })
    .store({ direct: REMAINDER })
    .load({ direct: POW })
    .add({ direct: POW })
    .store({ direct: POW })
    // AftIn
    .label("DivAftIn")
    .load({ direct: K })
    .subt({ direct: REMAINDER })
    .store({ direct: K })
    .load({ direct: QUOTIENT })
    .add({ direct: POW })
    .store({ direct: QUOTIENT })
    .jump("DivOuter")
    // Done
    .label("DivDone")
    .load({ direct: K })
    .skipIfCondition("lessThan")
    .jump("DivReturn")
    .decrement({ direct: QUOTIENT })
    // Return
    .label("DivReturn")
    .load({ direct: MATH_ARG_2 })
    .skipIfCondition("equal")
    .jump("DivReturnMod")
    // Return quotient
    .copy({ direct: QUOTIENT }, { direct: MATH_RESULT })
    .jumpI(DIVIDE)
    // Return reamainder
    .label("DivReturnMod")
    .load({ direct: K })
    .skipIfCondition("equal")
    .add({ direct: REMAINDER })
    .store({ direct: MATH_RESULT })
    .jumpI(DIVIDE);
};
