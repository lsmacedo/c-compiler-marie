import * as fs from "fs";
import { parseCode } from "./parse";
import { compileForMarieAssemblyLanguage } from "./compile";

const code = fs.readFileSync("./examples/1-fibonacci.c", "utf-8");

const parsedCode = parseCode(code);
const assemblyCode = compileForMarieAssemblyLanguage(parsedCode);
console.log(assemblyCode);
