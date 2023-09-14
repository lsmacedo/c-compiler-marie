import { parseValue } from "..";
import { Operation } from "../../types";

const relational = {
  regex:
    /^\s*(?<firstOperand>[^\s]+(?:\(.*?\))|[^\s]+)\s*(?<operator>\>=|\<=|==|!=|[><])\s*(?<secondOperand>.+?)\s*;?\s*$/,
  parser: (matches: RegExpMatchArray): Operation => {
    const [_, firstOperandString, operator, secondOperandString] = matches;
    const firstOperand = parseValue(firstOperandString);
    const secondOperand = parseValue(secondOperandString);
    return { firstOperand, operator, secondOperand };
  },
};

export default relational;
