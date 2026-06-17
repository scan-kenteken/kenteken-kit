import { readFileSync, writeFileSync } from "node:fs";
import { SEMVER_RE, gradleSnippet, mavenSnippet, GRADLE_SNIPPET_RE, MAVEN_SNIPPET_RE } from "./version-utils.mjs";

const version = readFileSync("VERSION", "utf8").trim();

if (!SEMVER_RE.test(version)) {
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
  .replace(GRADLE_SNIPPET_RE, gradleSnippet(version))
  .replace(MAVEN_SNIPPET_RE, mavenSnippet(version));
writeFileSync(kotlinReadmePath, kotlinReadme);

console.log(`Synced npm version to ${version}`);
