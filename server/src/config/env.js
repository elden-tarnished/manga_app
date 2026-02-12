import env from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const candidateEnvPaths = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];
const envPath =
  candidateEnvPaths.find((candidatePath) => fs.existsSync(candidatePath)) ??
  candidateEnvPaths[0];

env.config({ path: envPath });

export { envPath };
