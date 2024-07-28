import { Service } from "typedi";
import { POP } from "./compile/procedures/pop";
import { PUSH } from "./compile/procedures/push";

export type VariableType = {
  literal?: number;
  direct?: string;
  indirect?: string;
};

@Service()
export class Codegen {
  protected code = "";
  variables = {} as { [name: string]: number };
  procedures = [] as string[];
  readonlyData = [] as number[];

  public write(str: string): Codegen {
    this.code += `${str}\n`;
    return this;
  }

  protected varName(value: VariableType): string {
    const variable = value.direct ?? value.indirect ?? `_${value.literal}`;
    if (
      this.variables[variable] === undefined &&
      !this.procedures.includes(variable)
    ) {
      this.declareVariables({ [variable]: value.literal ?? 0 });
    }
    return variable;
  }

  declareVariables(variables: { [name: string]: number }) {
    this.variables = { ...this.variables, ...variables };
    return this;
  }

  org(position: number) {
    return this.write(`Org ${position}\n`);
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
  add(a: VariableType) {
    if (a.literal == 0) {
      return this;
    }
    this.write(`${a.indirect ? "AddI" : "Add"} ${this.varName(a)}`);
    return this;
  }
  addValues(a: VariableType, b: VariableType, persist: boolean) {
    this.load(a).add(b);
    if (persist) {
      this.store(a);
    }
    return this;
  }
  subt(a: VariableType) {
    if (a.literal == 0) {
      return this;
    }
    if (a.direct || a.literal) {
      this.write(`Subt ${this.varName(a)}`);
      return this;
    }
    // Persist accumulator value
    this.store({ direct: "_minuend" });
    // Persist indirect value, since there is no SubtI command
    this.copy(a, { direct: "_subtrahend" });
    // Load value into the accumulator
    this.load({ direct: "_minuend" });
    // Subtract
    this.write(`Subt _subtrahend`);
    return this;
  }
  subtValues(a: VariableType, b: VariableType, persist: boolean) {
    this.load(a).subt(b);
    if (persist) {
      this.store(a);
    }
    return this;
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

  skipIf(
    first: VariableType,
    condition: "lessThan" | "equal" | "greaterThan",
    second: VariableType
  ) {
    let x: number;
    if (condition === "lessThan") {
      x = 0;
    } else if (condition === "equal") {
      x = 400;
    } else {
      x = 800;
    }
    return this.subtValues(first, second, false).write(`Skipcond ${x}`);
  }
  skipIfAc(
    condition: "lessThan" | "equal" | "greaterThan",
    second?: VariableType
  ) {
    let x: number;
    if (condition === "lessThan") {
      x = 0;
    } else if (condition === "equal") {
      x = 400;
    } else {
      x = 800;
    }
    if (!second) {
      return this.write(`Skipcond ${x}`);
    }
    return this.subt(second).write(`Skipcond ${x}`);
  }

  procedure(name: string) {
    this.procedures.unshift(name);
    return this.write(`\n${name}, HEX 0`);
  }
  label(name: string) {
    this.code += `${name}, `;
    return this;
  }

  push(value?: VariableType) {
    if (value) {
      this.load(value);
    }
    this.jnS(PUSH);
    return this;
  }
  pop(to: VariableType) {
    this.jnS(POP).store(to);
    return this;
  }

  getInstructionsCount() {
    return (
      this.code
        .replace(/(\/.*)/g, "")
        .split("\n")
        .filter((a) => a.trim()).length + Object.keys(this.variables).length
    );
  }

  getCode() {
    const variables = Object.keys(this.variables).sort();
    const variableDeclarations = variables
      .map((variable) => `${variable}, DEC ${this.variables[variable]}`)
      .join("\n");
    return `${this.code.trim()}\n\n${variableDeclarations}`;
  }
}
