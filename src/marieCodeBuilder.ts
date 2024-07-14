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
    const varName = `_${literal}`;
    this.declareVariables({ [varName]: literal });
    return { varName, value: { literal: literal } };
  }

  protected varName(value: VariableType) {
    let variable: string;
    if (value.literal !== undefined) {
      variable = `_${value.literal}`;
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

  org(position: number) {
    return this.write(`Org ${position}`);
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
  add(a: VariableType, b?: VariableType, output?: string) {
    if (b === undefined) {
      // Only 'a' is provided, add it to the accumulator
      this.write(`${a.indirect ? "AddI" : "Add"} ${this.varName(a)}`);
    } else {
      // Load 'a' into the accumulator, and then add 'b'
      this.load(a);
      this.write(`${b.indirect ? "AddI" : "Add"} ${this.varName(b)}`);
    }
    if (output) {
      this.store({ direct: output });
    }
    return this;
  }
  subt(a: VariableType, b?: VariableType, output?: string) {
    let minuend = b !== undefined ? a : undefined;
    const subtrahend = b ?? a;

    if (subtrahend.literal === 0) {
      if (minuend) {
        this.load(minuend);
      }
    } else if (subtrahend.indirect) {
      // Persist accumulator value if only one parameter is passed
      if (minuend === undefined) {
        this.store({ direct: "$MINUEND" });
      }
      // Persist indirect subtrahend value, since there is no SubtI command
      if (subtrahend.indirect) {
        this.copy(subtrahend, { direct: "$SUBTRAHEND" });
      }
      // Load minuend into the accumulator
      if (minuend === undefined) {
        this.load({ direct: "$MINUEND" });
      } else {
        this.load(minuend);
      }
      // Subtract
      const subtrahendString = subtrahend.indirect
        ? "$SUBTRAHEND"
        : this.varName(subtrahend);
      this.write(`Subt ${subtrahendString}`);
    } else {
      // Load minuend into the accumulator
      if (minuend !== undefined) {
        this.load(minuend);
      }
      // Subtract
      const subtrahendString = this.varName(subtrahend);
      this.write(`Subt ${subtrahendString}`);
    }

    if (output) {
      this.store({ direct: output });
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
    return this.subt(first, second).write(`Skipcond ${x}`);
  }
  skipIfAc(
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
    return this.subt(second).write(`Skipcond ${x}`);
  }

  procedure(name: string) {
    this.procedures.unshift(name);
    return this.write(`\n${name}, DEC 0`);
  }
  label(name: string) {
    this.code += `${name}, `;
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
    return `${this.code}\n${variableDeclarations}\n`;
  }
}
