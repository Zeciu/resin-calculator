import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const kbPath = resolve(process.argv[2]);
const { KNOWLEDGE_BASE_ENTRIES } = await import(pathToFileURL(kbPath).href);
process.stdout.write(JSON.stringify(KNOWLEDGE_BASE_ENTRIES));
