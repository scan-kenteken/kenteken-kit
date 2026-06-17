import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const version = readFileSync("VERSION", "utf8").trim();
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const kotlinReadme = readFileSync("kotlin/README.md", "utf8");

if (pkg.version !== version) {
  console.error(`package.json (${pkg.version}) does not match VERSION (${version})`);
  process.exit(1);
}

const kotlinVersion = execSync("./gradlew -q printVersion", {
  cwd: "kotlin",
  encoding: "utf8",
}).trim();

if (kotlinVersion !== version) {
  console.error(`kotlin (${kotlinVersion}) does not match VERSION (${version})`);
  process.exit(1);
}

const expectedGradleSnippet = `io.github.scan-kenteken:kenteken-kit:${version}`;
const expectedMavenSnippet = `<version>${version}</version>`;

if (!kotlinReadme.includes(expectedGradleSnippet) || !kotlinReadme.includes(expectedMavenSnippet)) {
  console.error("kotlin/README.md install snippets do not match VERSION");
  process.exit(1);
}

console.log(`Version ${version} is in sync across npm and Kotlin`);
