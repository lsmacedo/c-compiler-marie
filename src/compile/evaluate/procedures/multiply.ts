import { MATH_ARG_0, MATH_ARG_1, MATH_RESULT } from ".";
import { marieCodeBuilder } from "../../state";

export const MULTIPLY = "Multiply";

const MULTIPLICAND = "$MultiplyMultiplicand";
const MULTIPLIER = "$MultiplyMultiplier";
const PRODUCT = "$MultiplyProduct";

export const declareMultiply = () => {
  // Declare procedure divide
  marieCodeBuilder
    .procedure(MULTIPLY)
    .copy({ literal: 0 }, { direct: PRODUCT })
    .skipIf({ direct: MATH_ARG_0 }, "greaterThan", { direct: MATH_ARG_1 })
    .jump("MultiplyElse0")
    // Then0
    .label("MultiplyThen0")
    .copy({ direct: MATH_ARG_0 }, { direct: MULTIPLICAND })
    .copy({ direct: MATH_ARG_1 }, { direct: MULTIPLIER })
    .jump("MultiplyLoop")
    // Else0
    .label("MultiplyElse0")
    .copy({ direct: MATH_ARG_1 }, { direct: MULTIPLICAND })
    .copy({ direct: MATH_ARG_0 }, { direct: MULTIPLIER })
    // Loop
    .label("MultiplyLoop")
    .skipIf({ direct: MULTIPLIER }, "greaterThan", { literal: 0 })
    .jump("MultiplyEnd")
    .add({ direct: PRODUCT }, { direct: MULTIPLICAND }, PRODUCT)
    .subt({ direct: MULTIPLIER }, { literal: 1 }, MULTIPLIER)
    .jump("MultiplyLoop")
    // End
    .label("MultiplyEnd")
    .copy({ direct: PRODUCT }, { direct: MATH_RESULT })
    .jumpI(MULTIPLY);
};
