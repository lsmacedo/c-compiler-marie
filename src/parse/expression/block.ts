import { parseExpression, parseValue } from "..";
import { Block, Expression, Value } from "../../types";

const block = {
  regex: /^\s*(?:(?<type>if|while|for)\s*\(\s*(?<content>.*?)\s*\)\s*)?{\s*$/,
  parser: (matches: RegExpMatchArray): Block => {
    const [_, type, content] = matches;
    let condition: Value;
    let forStatements: Expression[] | undefined;
    if (type === "if" || type === "while") {
      condition = parseValue(content);
    } else if (type === "for") {
      const statements = content.split(",");
      condition = parseValue(statements[1]);
      forStatements = [
        parseExpression(statements[0]),
        parseExpression(statements[2]),
      ];
    } else {
      throw new Error("Invalid block type");
    }
    return { type, condition, forStatements };
  },
};

export default block;
