import arithmetic from "./arithmetic";
import array from "./array";
import block from "./block";
import blockEnd from "./blockEnd";
import functionCall from "./functionCall";
import functionDefinition from "./functionDefinition";
import literal from "./literal";
import logical from "./logical";
import macro from "./macro";
import postfix from "./postfix";
import prefix from "./prefix";
import relational from "./relational";
import returnExpression from "./return";
import type from "./type";
import typedef from "./typedef";
import variable from "./variable";
import variableAssignment from "./variableAssignment";
import variableDeclaration from "./variableDeclaration";

export const expressionTypes = {
  typedef,
  macro,
  functionCall,
  return: returnExpression,
  block,
  functionDefinition,
  variableDeclaration,
  variableAssignment,
  type,
  literal,
  array,
  variable,
  logical,
  relational,
  arithmetic,
  prefix,
  postfix,
  blockEnd,
};
