import { Codegen } from "../../marieCodegen";

export const COMPARE_FIRST_OPERAND = "__compare_firstoperand";
export const COMPARE_SECOND_OPERAND = "__compare_secondoperand";
export const COMPARE_EQ = "__compare_eq";
export const COMPARE_NEQ = "__compare_neq";
export const COMPARE_GT = "__compare_gt";
export const COMPARE_GTE = "__compare_gte";
export const COMPARE_LT = "__compare_lt";
export const COMPARE_LTE = "__compare_lte";

export function declareCompareEq(codegen: Codegen) {
  codegen
    .procedure(COMPARE_EQ)
    .store({ direct: COMPARE_SECOND_OPERAND })
    .subtValues(
      { direct: COMPARE_FIRST_OPERAND },
      { direct: COMPARE_SECOND_OPERAND },
      false
    )
    .skipIfAc("equal", { literal: 0 })
    .load({ literal: -1 })
    .add({ literal: 1 })
    .jumpI(COMPARE_EQ);
}

export function declareCompareNeq(codegen: Codegen) {
  codegen
    .procedure(COMPARE_NEQ)
    .store({ direct: COMPARE_SECOND_OPERAND })
    .subtValues(
      { direct: COMPARE_FIRST_OPERAND },
      { direct: COMPARE_SECOND_OPERAND },
      false
    )
    .skipIfAc("equal", { literal: 0 })
    .load({ literal: 1 })
    .jumpI(COMPARE_NEQ);
}

export function declareCompareGt(codegen: Codegen) {
  codegen
    .procedure(COMPARE_GT)
    .store({ direct: COMPARE_SECOND_OPERAND })
    .subtValues(
      { direct: COMPARE_FIRST_OPERAND },
      { direct: COMPARE_SECOND_OPERAND },
      false
    )
    .skipIfAc("greaterThan", { literal: 0 })
    .jump(`${COMPARE_GT}_false`)
    .load({ literal: 1 })
    .jumpI(COMPARE_GT)
    .label(`${COMPARE_GT}_false`)
    .load({ literal: 0 })
    .jumpI(COMPARE_GT);
}

export function declareCompareGte(codegen: Codegen) {
  codegen
    .procedure(COMPARE_GTE)
    .add({ literal: 1 })
    .store({ direct: COMPARE_SECOND_OPERAND })
    .subtValues(
      { direct: COMPARE_FIRST_OPERAND },
      { direct: COMPARE_SECOND_OPERAND },
      false
    )
    .skipIfAc("greaterThan", { literal: 0 })
    .jump(`${COMPARE_GTE}_false`)
    .load({ literal: 1 })
    .jumpI(COMPARE_GTE)
    .label(`${COMPARE_GTE}_false`)
    .load({ literal: 0 })
    .jumpI(COMPARE_GTE);
}

export function declareCompareLt(codegen: Codegen) {
  codegen
    .procedure(COMPARE_LT)
    .store({ direct: COMPARE_SECOND_OPERAND })
    .subtValues(
      { direct: COMPARE_FIRST_OPERAND },
      { direct: COMPARE_SECOND_OPERAND },
      false
    )
    .skipIfAc("lessThan", { literal: 0 })
    .jump(`${COMPARE_LT}_false`)
    .load({ literal: 1 })
    .jumpI(COMPARE_LT)
    .label(`${COMPARE_LT}_false`)
    .load({ literal: 0 })
    .jumpI(COMPARE_LT);
}

export function declareCompareLte(codegen: Codegen) {
  codegen
    .procedure(COMPARE_LTE)
    .subt({ literal: 1 })
    .store({ direct: COMPARE_SECOND_OPERAND })
    .subtValues(
      { direct: COMPARE_FIRST_OPERAND },
      { direct: COMPARE_SECOND_OPERAND },
      false
    )
    .skipIfAc("lessThan", { literal: 0 })
    .jump(`${COMPARE_LTE}_false`)
    .load({ literal: 1 })
    .jumpI(COMPARE_LTE)
    .label(`${COMPARE_LTE}_false`)
    .load({ literal: 0 })
    .jumpI(COMPARE_LTE);
}
