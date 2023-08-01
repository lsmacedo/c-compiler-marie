import { Value } from "../../types";
import { marieCodeBuilder } from "../state";

export const evaluateLiteral = (value: Value) => {
  marieCodeBuilder.comment(`Load literal ${value.literal}`);
  return { literal: value.literal };
};
