import { copyFileSync, existsSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const command = process.argv[2];
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const githubReadme = resolve(root, "README.md");
const npmReadme = resolve(root, "docs/npm.md");
const backupReadme = resolve(root, ".github-readme.tmp");

if (command === "npm") {
  if (existsSync(backupReadme)) {
    throw new Error("README backup already exists; run `node scripts/pack-readme.mjs restore` first.");
  }

  renameSync(githubReadme, backupReadme);
  copyFileSync(npmReadme, githubReadme);
} else if (command === "restore") {
  if (existsSync(backupReadme)) {
    renameSync(backupReadme, githubReadme);
  }
} else {
  throw new Error("Usage: node scripts/pack-readme.mjs npm|restore");
}
