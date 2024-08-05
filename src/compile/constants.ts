export const BASE_POINTER = "__bp";
export const STACK_POINTER = "__sp";
export const RETURN_VALUE = "__rval";
export const RETURN_ADDRESS = "__radd";
export const INTERMEDIATE_VARIABLE = "__ivar";
export const AUX = "__aux";

export const prologueFunctionName = (name: string) => `__${name}_prologue`;
export const epilogueFunctionName = (name: string) => `__${name}_epilogue`;
export const offsetFunctionName = (name: string) => `__${name}_setup_stack`;
export const scopeEndLabelName = (name: string) => `__end_${name}`;
