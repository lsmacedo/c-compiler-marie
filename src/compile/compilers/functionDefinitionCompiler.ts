import { Expression, FunctionDefinition } from "../../types";
import { FRAME_POINTER, STACK_POINTER } from "../stack/procedures";
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
      .comment("Store return address on stack frame")
      .copy({ direct: name }, { indirect: STACK_POINTER })
      .add({ direct: STACK_POINTER }, { literal: 1 }, STACK_POINTER);
  }
}
