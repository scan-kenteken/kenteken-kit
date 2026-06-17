import { readFileSync, writeFileSync } from "node:fs";

const version = readFileSync("VERSION", "utf8").trim();

if (!/^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/.test(version)) {
  console.error(`Invalid VERSION: ${version}`);
  process.exit(1);
}

const pkgPath = "package.json";
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.version = version;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const lockPath = "package-lock.json";
const lock = JSON.parse(readFileSync(lockPath, "utf8"));
lock.version = version;
if (lock.packages?.[""]) {
  lock.packages[""].version = version;
}
writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

console.log(`Synced npm version to ${version}`);
