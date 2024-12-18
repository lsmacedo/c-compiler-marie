import { parseValue } from "..";
import { Value } from "../../types";

function parseExpression(expression: string, skip = 0): Value {
  const result = expression.matchAll(
    /(?<!\+|-)[+\-\*\/%](?!\+|-)|(?<=\+\+|--)-+/g
  );
  const matches = [...result];
  const opIndex = matches[matches.length - 1 - skip].index || 0;
  const operator = expression[opIndex];

  try {
    const firstOperandStr = expression.slice(0, opIndex);
    const firstOperand = parseValue(firstOperandStr);

    const secondOperandStr = expression.slice(opIndex + 1);
    const secondOperand = parseValue(secondOperandStr);
    return { expression: { firstOperand, operator, secondOperand } };
  } catch (err) {
    return parseExpression(expression, skip + 1);
  }
}

const arithmetic = {
  regex:
    /^\s*(?<firstOperand>[^\s+-]+(?:\(.*?\))|[^\s+-]+)\s*(?<operator>(?!\+\+|\-\-)[+\-\*\/%])\s*(?<secondOperand>.+?(?:\(.*?\))|[^]+?)\s*;?\s*$/,
  stringParser: (str: string): Value => {
    return parseExpression(str);
  },
};

export default arithmetic;
