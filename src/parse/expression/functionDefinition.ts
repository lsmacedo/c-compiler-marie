import { FunctionDefinition } from "../../types";
import { typedefs } from "../state";

// Parser for function definition parameters
const parseFunctionDefinitionParameters = (
  params: string
): FunctionDefinition["params"] => {
  if (!params) {
    return [];
  }
  const regex =
    /^\s*(?<type>[^\s]+?)\s+(?<pointer>\*)?\s*(?<name>[^\s\[]+)\s*(?<array>\[[^\]]*\])?\s*$|^\s*(?<ellipsis>...)\s*/;
  return params
    .split(",")
    .filter((param) => !param.includes("..."))
    .map((param) => {
      const [_, type, pointer, name, array] = param.match(regex)!;
      const typedef = typedefs.find((typedef) => typedef.alias === type);
      return {
        type: typedef?.originalType ?? type,
        name,
        isPointer: pointer !== undefined,
        isArray: array !== undefined,
      };
    })
    .filter((param) => param);
};

const functionDefinition = {
  regex:
    /^\s*(?<static>static)?\s*(?<type>[^\s]+?)\s+(?<pointer>\*)?\s*(?<name>[^\s]+)\s*\(\s*(?<params>.+?)?\s*\)\s*{\s*$/,
  parser: (matches: string[]): FunctionDefinition => {
    const [_, staticFunction, type, pointer, name, params] = matches;
    const typedef = typedefs.find((typedef) => typedef.alias === type);
    return {
      type: typedef?.originalType ?? type,
      isPointer: pointer !== undefined,
      name,
      params: parseFunctionDefinitionParameters(params),
      isVariadic: params?.includes("...") ?? false,
    };
  },
};

export default functionDefinition;
