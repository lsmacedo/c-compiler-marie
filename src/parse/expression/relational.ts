import { parseValue } from "..";
import { Value } from "../../types";

const relational = {
  regex:
    /^\s*(?<firstOperand>[^\s]+(?:\(.*?\))|[^\s]+)\s*(?<operator>\>=|\<=|==|!=|[><])\s*(?<secondOperand>.+?)\s*;?\s*$/,
  parser: (matches: RegExpMatchArray): Value => {
    const [_, firstOperandString, operator, secondOperandString] = matches;
    const firstOperand = parseValue(firstOperandString);
    const secondOperand = parseValue(secondOperandString);
    return { expression: { firstOperand, operator, secondOperand } };
  },
};

export default relational;
