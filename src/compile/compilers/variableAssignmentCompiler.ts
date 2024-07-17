import { Expression, VariableAssignment } from "../../types";
import { evaluate } from "../evaluate";
import { declareVariable, getVariableDefinition } from "../stack";
import { PUSH_STRING_TO_STACK } from "../stack/procedures/pushStringToStack";
import { counters, marieCodeBuilder } from "../state";
import { ExpressionCompiler } from "./expressionCompiler";

export class VariableAssignmentCompiler implements ExpressionCompiler {
  compile(expression: Expression) {
    const { type, pointerOperation, name, arraySize, arrayPosition, value } =
      expression as VariableAssignment;
    if (type) {
      const isPointer = pointerOperation || false;

      // In order to obtain a simpler generated code, memory allocation will
      // happen somewhere else when initializing an array
      const allocMemory = !value?.elements?.length || isPointer;

      // Imply variable based on following logic:
      // 1. Pointers have length 1
      // 2. Obtain array length from its declaration (e.g. int arr[4])
      // 3. Obtain length from value it is being assigned to (e.g. int arr[] = {0,1,2,3})
      // 4. Fallback to size 1
      const size = isPointer
        ? { literal: 1 }
        : arraySize ?? { literal: value?.elements?.length || 1 };
      const evaluatedSize = evaluate(size);

      declareVariable(name, evaluatedSize, isPointer, allocMemory);
    }
    if (!value) {
      return;
    }
    if (value.elements) {
      const valueVariable = evaluate(value);
      // If using an initializer list, point array to the evaluated elements
      if (!value.isString) {
        marieCodeBuilder
          .comment(`Initialize variable ${name}`)
          .copy(valueVariable, { direct: name });
        return;
      }
      // If assigning string into a pointer, simply point variable to the string
      if (getVariableDefinition(name)?.isPointer) {
        marieCodeBuilder
          .comment(`Assign value to variable ${name}`)
          .copy(valueVariable, { indirect: name });
        return;
      }
      // Otherwise, copy string into stack and then reference it
      marieCodeBuilder
        .comment(`Initialize variable ${name}`)
        .load(valueVariable)
        .jnS(PUSH_STRING_TO_STACK)
        .store({ direct: name });
      return;
    }

    marieCodeBuilder.comment(`Assign value to variable ${name}`);
    const valueVariable = evaluate(value);
    const positionsToSkip = arrayPosition ? evaluate(arrayPosition) : undefined;

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
