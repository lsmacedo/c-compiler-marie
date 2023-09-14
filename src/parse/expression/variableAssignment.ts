import { parseValue } from "..";
import { VariableAssignment } from "../../types";

const variableAssignment = {
  regex:
    /^\s*(?<pointer>\*)?\s*(?<name>[^\s\[]+)\s*(?<array>\[[^\]]+\])?\s*\=\s*(?<value>.+?)\s*;?\s*$/,
  parser: (matches: string[]): VariableAssignment => {
    const [_, pointer, name, array, value] = matches;
    return {
      name,
      pointerOperation: pointer !== undefined,
      arrayPosition: array
        ? parseValue(array.substring(1, array.length - 1))
        : undefined,
      value: parseValue(value),
    };
  },
};

export default variableAssignment;
