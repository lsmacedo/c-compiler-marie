import { MATH_ARG_0, MATH_ARG_1, MATH_ARG_2, MATH_RESULT } from ".";
import { marieCodeBuilder } from "../../state";

export const DIVIDE = "Divide";

const K = "$DivideK";
const QUOTIENT = "$DivideQuotient";
const REMAINDER = "$DivideRemainder";

export const declareDivide = () => {
  // Declare procedure divide
  marieCodeBuilder
    .procedure(DIVIDE)
    .copy({ literal: 0 }, { direct: QUOTIENT })
    .copy({ direct: MATH_ARG_0 }, { direct: K })
    // Loop
    .label("DivideLoop")
    .load({ direct: K })
    // If
    .label("DivideIf")
    .subt({ direct: MATH_ARG_1 })
    .skipIfAc("lessThan", { literal: 0 })
    .jump("DivideElse")
    // Then
    .label("DivideThen")
    .jump("DivideEndIf")
    // Else
    .label("DivideElse")
    .store({ direct: K })
    .load({ direct: QUOTIENT })
    .add({ literal: 1 })
    .store({ direct: QUOTIENT })
    .jump("DivideLoop")
    // EndIf
    .label("DivideEndIf")
    .skipIf({ direct: MATH_ARG_2 }, "equal", { literal: 0 })
    .jump("DivideReturnRemainder")
    // ReturnQuotient
    .label("DivideReturnQuotient")
    .copy({ direct: QUOTIENT }, { direct: MATH_RESULT })
    .jumpI(DIVIDE)
    // ReturnRemainder
    .label("DivideReturnRemainder")
    .skipIf({ direct: K }, "equal", { literal: 0 })
    .add({ direct: REMAINDER })
    .store({ direct: MATH_RESULT })
    .jumpI(DIVIDE);
};
