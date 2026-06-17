// Shared version helpers so the writer (sync-version) and the checker
// (check-versions) can't disagree on snippet shapes or the semver format.

export const SEMVER_RE = /^\d+\.\d+\.\d+(-[A-Za-z0-9.]+)?$/;

export const gradleSnippet = (version) => `io.github.scan-kenteken:kenteken-kit:${version}`;
export const mavenSnippet = (version) => `<version>${version}</version>`;

const ANY_VERSION = "[0-9]+\\.[0-9]+\\.[0-9]+(?:-[A-Za-z0-9.]+)?";
export const GRADLE_SNIPPET_RE = new RegExp(`io\\.github\\.scan-kenteken:kenteken-kit:${ANY_VERSION}`, "g");
export const MAVEN_SNIPPET_RE = new RegExp(`<version>${ANY_VERSION}</version>`, "g");
