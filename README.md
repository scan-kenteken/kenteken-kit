# kenteken-kit

Tiny Dutch kenteken formatting, parsing, and validation for JavaScript,
TypeScript, and Kotlin.

`formatKentekenPartial` formats live input as a Dutch plate while the user types.

<p align="center">
  <img src="./assets/format-kenteken-partial-demo.gif" alt="formatKentekenPartial demo: valid and invalid Dutch plates" />
</p>

## Packages

| Platform | Package | Docs |
|---|---|---|
| JavaScript / TypeScript | [`kenteken-kit`](https://www.npmjs.com/package/kenteken-kit) | [`docs/npm.md`](./docs/npm.md) |
| Kotlin / JVM | `io.github.scan-kenteken:kenteken-kit` | [`kotlin/README.md`](./kotlin/README.md) |

Both implementations share fixtures from [`fixtures/plates.shared.json`](./fixtures/plates.shared.json)
so formatter and validator behavior stays aligned across platforms.

## JavaScript Quick Start

```sh
npm install kenteken-kit
```

```ts
import {
  formatKenteken,
  formatKentekenPartial,
  isKenteken,
  normalizeKenteken,
  parseKenteken,
} from "kenteken-kit";

normalizeKenteken(" kjr-50.s "); // "KJR50S"
formatKenteken("kjr50s"); // "KJR-50-S"
formatKentekenPartial("kjr5"); // "KJR-5"
isKenteken("G-001-BB"); // true

parseKenteken("G-001-BB");
```

## Kotlin Quick Start

```kotlin
import com.github.scankenteken.kit.KentekenKit

val normalized = KentekenKit.normalize(" ss-12.12 ")
val formatted = KentekenKit.format("G001BB")
val partial = KentekenKit.formatPartial("kjr5")
val valid = KentekenKit.isValid("G-001-BB")
```

## Repository Development

Run the JavaScript package checks:

```sh
npm test
```

Run the Kotlin package checks:

```sh
cd kotlin
./gradlew test
```

Check that npm, Maven, and the repo-root `VERSION` file agree:

```sh
npm run version:check
```

## Releasing

One version (`VERSION` at the repo root) drives both npm and Maven publishes.

```sh
npm run version:bump patch   # or minor | major
git add VERSION package.json package-lock.json kotlin/build.gradle.kts
git commit -m "Release v$(cat VERSION)"
git tag "v$(cat VERSION)"
git push origin main --tags
```

The `ci.yml` workflow then:

1. Runs npm and Kotlin tests plus `npm run version:check`
2. Publishes to npm through Trusted Publishing
3. Publishes to Maven Central as `io.github.scan-kenteken:kenteken-kit`

npm Trusted Publishing must list workflow `ci.yml` for
`scan-kenteken/kenteken-kit`.

GitHub secrets required for Maven Central:

| Secret | Purpose |
|---|---|
| `CENTRAL_PORTAL_USERNAME` | Portal user token username |
| `CENTRAL_PORTAL_PASSWORD` | Portal user token password |
| `SIGNING_KEY` | ASCII-armored PGP private key |
| `SIGNING_PASSWORD` | Only if your key has a passphrase |

After CI uploads to Maven Central, open
[central.sonatype.com/publishing](https://central.sonatype.com/publishing) to
validate and publish the deployment.

## License

MIT
