import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const glossaryPath = resolve(process.argv[2]);
const { GLOSSARY_ENTRIES } = await import(pathToFileURL(glossaryPath).href);
process.stdout.write(JSON.stringify(GLOSSARY_ENTRIES));
