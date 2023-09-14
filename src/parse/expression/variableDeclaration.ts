import { parseValue } from "../index";
import { VariableAssignment } from "../../types";
import { typedefs } from "../state";

const variableDeclaration = {
  regex:
    /^\s*(?<type>[^\s]+?)\s+(?<pointer>\*)?\s*(?<name>[^\s\[]+?)\s*(?<array>\[[^\]]*?\])?\s*(?:\=\s*(?<value>.+?))?\s*;?\s*$/,
  parser: (matches: string[]): VariableAssignment => {
    const [_, type, pointer, name, array, value] = matches;
    const typedef = typedefs.find((typedef) => typedef.alias === type);
    return {
      type: typedef?.originalType ?? type,
      name,
      isArray: array !== undefined,
      pointerOperation: pointer !== undefined,
      arraySize:
        array?.length > 2
          ? parseValue(array.substring(1, array.length - 1))
          : undefined,
      value: value ? parseValue(value) : undefined,
    };
  },
};

export default variableDeclaration;
