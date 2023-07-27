import { Value } from "./types";

export type VariableType = {
  literal?: number;
  direct?: string;
  indirect?: string;
};

export class Builder {
  protected code = "";
  variables = {} as { [name: string]: number };
  procedures = [] as string[];

  constructor(code = "", variables = {}) {
    this.code = code;
    this.variables = variables;
  }

  protected write(str: string) {
    this.code += `${str}\n`;
    return this;
  }

  protected literal(literal: number) {
    const varName = `$${literal}`;
    this.declareVariables({ [varName]: literal });
    return { varName, value: { literal: literal } };
  }

  protected varName(value: VariableType) {
    let variable: string;
    if (value.literal !== undefined) {
      variable = `$${value.literal}`;
      if (!this.variables[variable]) {
        this.declareVariables({ [variable]: value.literal });
      }
    } else {
      variable = value.direct ?? value.indirect ?? "";
      if (
        this.variables[variable] === undefined &&
        !this.procedures.includes(variable)
      ) {
        this.declareVariables({ [variable]: 0 });
      }
    }
    return variable;
  }

  declareVariables(variables: { [name: string]: number }) {
    this.variables = { ...this.variables, ...variables };
    return this;
  }

  comment(str: string) {
    return this.write(`/ ${str}`);
  }
  clear() {
    return this.write("Clear");
  }
  input() {
    return this.write("Input");
  }
  output() {
    return this.write("Output");
  }
  add(by: VariableType) {
    const instruction = by.indirect ? "AddI" : "Add";
    return this.write(`${instruction} ${this.varName(by)}`);
  }
  subt(by: VariableType) {
    return this.write(`Subt ${this.varName(by)}`);
  }
  jump(to: string) {
    return this.write(`Jump ${to}`);
  }
  jumpI(to: string) {
    return this.write(`JumpI ${to}`);
  }
  jnS(to: string) {
    return this.write(`JnS ${to}`);
  }
  skipIfCondition(condition: "lessThan" | "equal" | "greaterThan") {
    let x: number;
    if (condition === "lessThan") {
      x = 0;
    } else if (condition === "equal") {
      x = 400;
    } else {
      x = 800;
    }
    return this.write(`Skipcond ${x}`);
  }
  halt() {
    return this.write("Halt");
  }

  load(from: VariableType) {
    const instruction = from.indirect ? "LoadI" : "Load";
    return this.write(`${instruction} ${this.varName(from)}`);
  }
  store(to: VariableType) {
    const instruction = to.indirect ? "StoreI" : "Store";
    return this.write(`${instruction} ${this.varName(to)}`);
  }

  copy(from: VariableType, to: VariableType) {
    return this.load(from).store(to);
  }
  increment(from: VariableType) {
    return this.load(from).add({ literal: 1 }).store(from);
  }
  decrement(from: VariableType) {
    return this.load(from).subt({ literal: 1 }).store(from);
  }

  skipIfEqual(first: VariableType, second: VariableType) {
    return this.load(first).subt(second).skipIfCondition("equal");
  }

  procedure(name: string) {
    this.procedures.unshift(name);
    return this.write(`\n${name}, DEC 0`);
  }
  label(name: string) {
    this.code += `${name}, `;
    return this;
  }

  getCode() {
    const variables = Object.keys(this.variables).sort();
    const variableDeclarations = variables
      .map((variable) => `${variable}, DEC ${this.variables[variable]}`)
      .join("\n");
    return `${this.code}\n${variableDeclarations}\n`;
  }
}
