# kenteken-kit Kotlin

Kotlin/JVM implementation of the same Dutch kenteken utilities exposed by the
JavaScript package.

## Install

Gradle Kotlin DSL:

```kotlin
dependencies {
  implementation("io.github.scan-kenteken:kenteken-kit:0.2.6")
}
```

Maven:

```xml
<dependency>
  <groupId>io.github.scan-kenteken</groupId>
  <artifactId>kenteken-kit</artifactId>
  <version>0.2.6</version>
</dependency>
```

## API

- `normalize(raw: String): String`
- `format(raw: String): String`
- `isValid(raw: String): Boolean`
- `formatPartial(raw: String): String`

## Usage

```kotlin
import com.github.scankenteken.kit.KentekenKit

val normalized = KentekenKit.normalize(" ss-12.12 ")
val formatted = KentekenKit.format("G001BB")
val partial = KentekenKit.formatPartial("kjr5")
val valid = KentekenKit.isValid("G-001-BB")
```

## Shared Fixtures

Shared test fixtures live in [`../fixtures/plates.shared.json`](../fixtures/plates.shared.json)
and are consumed by both:

- JavaScript tests in [`../test/index.test.mjs`](../test/index.test.mjs)
- Kotlin tests in `src/test/kotlin/com/github/scankenteken/kit/DutchPlateValidatorTest.kt`

## Versioning

The Maven artifact version is read from the repo-root [`VERSION`](../VERSION) file (same as npm). CI checks parity with `npm run version:check` from the repository root.

## Development

Run tests from this directory:

```sh
./gradlew test
```

Publish to the local build repository:

```sh
./gradlew publish
```

The default local repository is:

```text
build/repo
```

## Maven Central

This module publishes through the Central Publisher Portal compatibility
endpoint. OSSRH reached end-of-life on 2025-06-30.

First-time requirements:

- Account at [central.sonatype.com](https://central.sonatype.com)
- Registered and verified namespace for your `groupId` at [Publishing > Namespaces](https://central.sonatype.com/publishing/namespaces)
- Portal user token, not a legacy OSSRH token
- GPG/PGP key pair for signing artifacts
- Completed POM metadata, included in this repo
- Manual release step in the Central Publisher Portal UI after upload

The current group config is `io.github.scan-kenteken`. Publishing fails with
`File is not related to an authorized namespace` until that namespace is
registered and verified.

Create local properties from the template:

```sh
cp gradle.properties.example gradle.properties
```

Set either Gradle properties or environment variables:

- `centralPortalUsername` / `CENTRAL_PORTAL_USERNAME`
- `centralPortalPassword` / `CENTRAL_PORTAL_PASSWORD`
- `centralPortalNamespace` / `CENTRAL_PORTAL_NAMESPACE`
- `signingKey` / `SIGNING_KEY`
- `signingPassword` / `SIGNING_PASSWORD`

Generate Portal tokens at [central.sonatype.com/account](https://central.sonatype.com/account).
OSSRH tokens no longer work.

One-command publish:

```sh
scripts/publish-to-central.sh
```

Or step by step:

```sh
./gradlew publish -PpublishToMavenCentral=true
```

Because Gradle's `maven-publish` plugin only uploads files, you must also send
the deployment to the Portal from the same machine/IP as the upload. Replace the
namespace with your registered namespace from
[central.sonatype.com/publishing/namespaces](https://central.sonatype.com/publishing/namespaces):

```sh
curl -X POST \
  "https://ossrh-staging-api.central.sonatype.com/manual/upload/defaultRepository/io.github.scan-kenteken" \
  -H "Authorization: Bearer $(printf '%s:%s' "$CENTRAL_PORTAL_USERNAME" "$CENTRAL_PORTAL_PASSWORD" | base64 -w0)"
```

Then open [central.sonatype.com/publishing](https://central.sonatype.com/publishing),
validate the deployment, and click **Publish** to release it to Maven Central.
