import { Service } from "typedi";
import { BASE_POINTER, STACK_POINTER } from "..";
import { Codegen } from "../../marieCodegen";
import { Expression } from "../../types";
import { RETURN } from "../procedures/return";
import { IExpressionCompiler } from "./type";

@Service()
export class BlockEndCompiler implements IExpressionCompiler {
  constructor(private codegen: Codegen) {}

  compile(expression: Expression): void {
    this.codegen
      .copy({ direct: BASE_POINTER }, { direct: STACK_POINTER })
      .pop({ direct: BASE_POINTER })
      .jnS(RETURN);
  }
}
