import { Service } from "typedi";

@Service()
export class CompilationState {
  public scope: string = "";
  public functions: {
    [scope: string]: {
      parameters: {
        name: string;
        type: string;
        isPointer: boolean;
        isArray: boolean;
      }[];
      variables: { name: string }[];
    };
  } = {};
}
