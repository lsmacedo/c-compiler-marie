import { Expression, VariableAssignment } from "../../types";
import { evaluate } from "../evaluate";
import { declareVariable, getVariableDefinition } from "../stack";
import { counters, marieCodeBuilder } from "../state";
import { ExpressionCompiler } from "./expressionCompiler";

export class VariableAssignmentCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const {
      type,
      pointerOperation,
      name,
      isArray,
      arraySize,
      arrayPosition,
      value,
    } = expression as VariableAssignment;
    if (type) {
      // Do not allocate memory at this point when using an initializer list,
      // as in the example: int arr[] = { 1, 2, 3 };
      const skipMemoryAlloc = value?.elements !== undefined;
      const evaluatedArraySize = arraySize ? evaluate(arraySize) : undefined;
      declareVariable(
        name,
        isArray
          ? evaluatedArraySize ?? { literal: value?.elements?.length }
          : undefined,
        skipMemoryAlloc
      );
    }
    if (value?.elements) {
      const valueVariable = evaluate(value);
      marieCodeBuilder.copy(valueVariable, { direct: name });
    }
    if (value && !value.elements) {
      marieCodeBuilder.comment(`Assign value to variable ${name}`);
      const valueVariable = evaluate(value);
      const positionsToSkip = arrayPosition
        ? evaluate(arrayPosition)
        : undefined;

      let variableName = name;
      // If setting value through pointer, load referenced address into tmp
      if (pointerOperation && !type) {
        variableName = `$TMP_${counters.tmp++}`;
        marieCodeBuilder.copy({ indirect: name }, { direct: variableName });
      }
      // If setting value at array position, load referenced address into tmp
      else if (arrayPosition) {
        // Load indirect if array was declared in another scope
        const loadType = getVariableDefinition(name) ? "direct" : "indirect";
        variableName = `$TMP_${counters.tmp++}`;
        marieCodeBuilder.copy({ [loadType]: name }, { direct: variableName });
      }

      if (positionsToSkip) {
        marieCodeBuilder.add(
          { direct: variableName },
          positionsToSkip,
          variableName
        );
      }
      marieCodeBuilder.copy(valueVariable, { indirect: variableName });
    }
  }
}
