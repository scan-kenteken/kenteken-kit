import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const kind = process.argv[2];

if (!kind || !["patch", "minor", "major"].includes(kind)) {
  console.error("Usage: node scripts/bump-version.mjs <patch|minor|major>");
  process.exit(1);
}

const current = readFileSync("VERSION", "utf8").trim();
const [major, minor, patch] = current.split(".").map(Number);

const next =
  kind === "major"
    ? `${major + 1}.0.0`
    : kind === "minor"
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

writeFileSync("VERSION", `${next}\n`);
execSync("node scripts/sync-version.mjs", { stdio: "inherit" });

console.log(`Bumped ${current} -> ${next}`);
