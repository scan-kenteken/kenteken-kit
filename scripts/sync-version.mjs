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

const kotlinReadmePath = "kotlin/README.md";
const kotlinReadme = readFileSync(kotlinReadmePath, "utf8")
  .replace(/io\.github\.scan-kenteken:kenteken-kit:[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.]+)?/g, `io.github.scan-kenteken:kenteken-kit:${version}`)
  .replace(/<version>[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.]+)?<\/version>/g, `<version>${version}</version>`);
writeFileSync(kotlinReadmePath, kotlinReadme);

console.log(`Synced npm version to ${version}`);
