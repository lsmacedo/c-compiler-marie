export type Value = {
  literal?: any;
  functionCall?: FunctionCall;
  variable?: string;
  isReference?: boolean;
  expression?: Operation;
};

export type VariableAssignment = {
  type?: string;
  name: string;
  value: Value;
};

export type FunctionDefinition = {
  type: string;
  name: string;
  params: {
    type: string;
    name: string;
  }[];
};

export type ScopeEnd = {
  type: string;
};

export type FunctionCall = {
  name: string;
  params: Value[];
};

export type Operation = {
  firstOperand: Value;
  operator: string;
  secondOperand: Value;
};

export type Return = {
  value: Value;
};

export type Block = {
  type: string;
  value: Value;
};

export type Expression = { expressionType: string } & (
  | Value
  | VariableAssignment
  | FunctionDefinition
  | ScopeEnd
  | FunctionCall
  | Operation
  | Return
  | Block
);