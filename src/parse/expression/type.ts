import { types } from "../state";
import { Value } from "../../types";

const regex = /^\s*(?<type>[^\s"'+\-\*\/%[\]{}\\&()]+?)\s*(?<pointer>\*)?\s*$/;

const type = {
  regex,
  isType: (value: string) => {
    const matches = value.match(regex);
    if (!matches) {
      return false;
    }
    const [_, type] = matches;
    return types.includes(type);
  },
  parser: (matches: RegExpMatchArray): Value => {
    const [_, type, pointer] = matches;
    return { literal: pointer ? -1 : types.indexOf(type) };
  },
};

export default type;
