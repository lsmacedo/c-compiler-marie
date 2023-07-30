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
  .option("file", {
    alias: "f",
    type: "string",
    demandOption: true,
  })
  .option("output", {
    alias: "o",
    type: "string",
    default: "a.mas",
  })
  .parseSync();

// Read file
const code = fs.readFileSync(args.file, "utf-8");

// Parse code
const parsedCode = parseCode(code);
if (args.verbose) {
  console.log(JSON.stringify(parsedCode));
}

// Generate assembly code
const assemblyCode = compileForMarieAssemblyLanguage(parsedCode);
fs.writeFileSync(args.output, assemblyCode);
