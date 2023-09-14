import { parseValue } from "..";
import { Value } from "../../types";

const variable = {
  regex:
    /^\s*(?<pointer>&)?\s*(?<variable>[^0-9^\s()\+\-\*\/\[\]{}&;][^\s()\+\-\*\/\[\]{}&;]*)\s*(?:\[(?<array>[^\]]+)\])?\s*;?\s*$/,
  parser: (matches: string[]): Value => {
    const [_, pointer, variable, arrayPosition] = matches;
    return {
      variable,
      isAddressOperation: pointer === "&",
      arrayPosition: arrayPosition ? parseValue(arrayPosition) : undefined,
    };
  },
};

export default variable;
