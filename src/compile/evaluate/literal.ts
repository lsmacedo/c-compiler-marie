import { Value } from "../../types";

export const evaluateLiteral = (value: Value) => {
  return { literal: value.literal };
};
