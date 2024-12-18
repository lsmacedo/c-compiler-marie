export type Value = {
  literal?: any;
  elements?: Value[];
  functionCall?: FunctionCall;
  variable?: string;
  arrayPosition?: Value;
  isAddressOperation?: boolean;
  isString?: boolean;
  expression?: Operation;
  prefix?: {
    operator: string;
    value: Value;
  };
  postfix?: {
    operator: string;
    value: Value;
  };
};

export type VariableAssignment = {
  type?: string;
  pointerOperation?: boolean;
  name: string;
  isArray?: boolean;
  arraySize?: Value;
  arrayPosition?: Value;
  value?: Value;
};

export type TypeDefinition = {
  originalType: string;
  alias: string;
};

export type Macro = {
  name: string;
  params?: string[];
  value: string;
};

export type FunctionDefinition = {
  type: string;
  name: string;
  isPointer: boolean;
  params: {
    type: string;
    name: string;
    isPointer: boolean;
    isArray: boolean;
  }[];
  isVariadic: boolean;
};

export type ScopeEnd = {
  type: string;
};

export type FunctionCall = {
  name: string;
  params: Value[];
  paramsStr?: string;
};

export type Operation = {
  firstOperand: Value;
  operator: string;
  secondOperand: Value;
};

export type Return = {
  value?: Value;
};

export type Block = {
  type: string;
  condition: Value;
  forStatements?: Expression[];
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
