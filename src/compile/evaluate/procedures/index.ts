import { marieCodeBuilder } from "../../state";

export const MATH_ARG_0 = "$MathArg0";
export const MATH_ARG_1 = "$MathArg1";
export const MATH_ARG_2 = "$MathArg2";
export const MATH_RESULT = "$MathResult";

const variables = {
  [MATH_ARG_0]: 0,
  [MATH_ARG_1]: 1,
};

export const initMath = () => {
  marieCodeBuilder.declareVariables(variables);
};
