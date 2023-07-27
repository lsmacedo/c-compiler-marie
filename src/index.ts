import * as fs from "fs";
import { parseCode } from "./parse";
import { compileForMarieAssemblyLanguage } from "./compile";

const filePath = process.argv[2];

const code = fs.readFileSync(filePath, "utf-8");

const parsedCode = parseCode(code);
const assemblyCode = compileForMarieAssemblyLanguage(parsedCode);
console.log(assemblyCode);
