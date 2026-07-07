import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const manualPath = resolve(process.argv[2]);
const { MANUAL_SECTIONS } = await import(pathToFileURL(manualPath).href);
process.stdout.write(JSON.stringify(MANUAL_SECTIONS));
