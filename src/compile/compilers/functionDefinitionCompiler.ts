import { Expression, FunctionDefinition } from "../../types";
import { FRAME_POINTER, STACK_POINTER } from "../stack/procedures";
import { INCREMENT_STACK_POINTER } from "../stack/procedures/incrementStackPointer";
import { marieCodeBuilder, scopes } from "../state";
import { ExpressionCompiler } from "./expressionCompiler";

export class FunctionDefinitionCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const { name, params } = expression as FunctionDefinition;
    scopes.unshift({ functionName: name });

    marieCodeBuilder.procedure(name);

    if (params.length) {
      marieCodeBuilder
        .comment("Store parameters addresses")
        .load({ indirect: FRAME_POINTER });
      params.forEach((param) => {
        marieCodeBuilder.subt({ literal: 1 }).store({ direct: param.name });
      });
    }

    marieCodeBuilder
      .comment("Store return address on stack")
      .copy({ direct: name }, { indirect: STACK_POINTER })
      .jnS(INCREMENT_STACK_POINTER);
  }
}
