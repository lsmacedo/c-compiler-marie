import { ScopeEnd } from "../../types";

const blockEnd = {
  regex: /^\s*(?<type>})\s*$/,
  parser: (matches: string[]): ScopeEnd => {
    return { type: matches[1] };
  },
};

export default blockEnd;
