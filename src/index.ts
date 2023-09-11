import * as fs from "fs";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { parseCode } from "./parse";
import { compileForMarieAssemblyLanguage } from "./compile";

const args = yargs(hideBin(process.argv))
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .option("output", {
    alias: "o",
    type: "string",
    default: "a.mas",
  })
  .parseSync();

// Read file
let code = "";
for (const file of args._) {
  code += "\n" + fs.readFileSync(file, "utf-8");
}

// Include standard libs
const include = new Set<string>();
const addIncludedLibs = (code: string) => {
  const matches = code.match(/^\s*#include\s+<(.+?)>\s*$/gm) || [];
  for (const m of matches) {
    const lib = m.split(" <")[1].split(".h>")[0];
    include.add(lib);
  }
};

addIncludedLibs(code);
for (const lib of include) {
  const libCode = fs.readFileSync(`src/lib/${lib}.c`);
  code += "\n" + libCode;
  addIncludedLibs(libCode.toString());
}

// Parse code
const parsedCode = parseCode(code);
if (args.verbose) {
  console.log(JSON.stringify(parsedCode));
}

// Generate assembly code
const assemblyCode = compileForMarieAssemblyLanguage(parsedCode);
fs.writeFileSync(args.output, assemblyCode);
