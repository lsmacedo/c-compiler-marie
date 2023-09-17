import { parseValue } from "..";
import { Value } from "../../types";

const logical = {
  regex:
    /^\s*(?<firstOperand>[^\s]+(?:\(.*?\))|.+?)\s*(?<operator>&&|\|\|)\s*(?<secondOperand>.+?)\s*;?\s*$/,
  parser: (matches: RegExpMatchArray): Value => {
    let [_, firstOperandString, operator, secondOperandString] = matches;

    let firstOperand = parseValue(firstOperandString);
    let secondOperand = parseValue(secondOperandString);

    // Fix expressions order
    if (
      secondOperand.expression &&
      ((operator === "&&" &&
        ["&&", "||"].includes(secondOperand.expression.operator)) ||
        (operator === "||" && secondOperand.expression.operator === "||"))
    ) {
      firstOperand = {
        expression: {
          firstOperand,
          operator,
          secondOperand: secondOperand.expression.firstOperand,
        },
      };
      operator = secondOperand.expression.operator;
      secondOperand = secondOperand.expression.secondOperand;
    }

    return { expression: { firstOperand, operator, secondOperand } };
  },
};

export default logical;
