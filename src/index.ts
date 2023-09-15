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

type LibDependencyList = {
  libName: string;
  libCode: string;
  libDependencies: LibDependencyList[];
};

const getDependenciesFromCode = (code: string): LibDependencyList[] => {
  return (code.match(/^\s*#include\s+<(.+?)>\s*$/gm) || []).map((include) => {
    const libName = include.split(" <")[1].split(".h>")[0];
    const libCode = fs.readFileSync(`src/lib/${libName}.c`, "utf-8");
    const libDependencies = getDependenciesFromCode(libCode);
    return { libName, libCode, libDependencies };
  });
};

const topologicalSort = (dependencyList: LibDependencyList) => {
  visitedLibs.add(dependencyList.libName);
  for (const dep of dependencyList.libDependencies) {
    if (!visitedLibs.has(dep.libName)) {
      topologicalSort(dep);
    }
  }
  orderedLibs.push(dependencyList);
};

// Read file
let code = "";
for (const file of args._) {
  code += "\n" + fs.readFileSync(file, "utf-8");
}

// Include libs
const libDependencies = getDependenciesFromCode(code);

// Perform topological sorting to order the libraries correctly
const orderedLibs: LibDependencyList[] = [];
const visitedLibs = new Set<string>();
topologicalSort({ libName: "", libCode: code, libDependencies });
code = orderedLibs.map((lib) => lib.libCode).join("\n");

// Parse code
const parsedCode = parseCode(code);
if (args.verbose) {
  console.log(JSON.stringify(parsedCode));
}

// Generate assembly code
const assemblyCode = compileForMarieAssemblyLanguage(parsedCode);
fs.writeFileSync(args.output, assemblyCode);
