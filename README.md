# kenteken-kit

`formatKentekenPartial` formats live input as a Dutch plate while the user types.

![formatKentekenPartial demo](./assets/format-kenteken-partial-demo.gif)

[Watch the MP4 demo](./assets/format-kenteken-partial-demo.mp4)

Tiny Dutch kenteken formatting, parsing, and validation for JavaScript, TypeScript, and Kotlin.

This package is intentionally small:

- no runtime dependencies
- pure functions, no class instance state
- modern ESM build
- TypeScript declarations
- partial formatting for live inputs and OCR cleanup
- parse results with issue codes instead of only `true` or `false`

## Install

```sh
npm install kenteken-kit
```

## Usage

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
// {
//   input: "G-001-BB",
//   normalized: "G001BB",
//   formatted: "G-001-BB",
//   series: 10,
//   seriesPattern: "X-999-XX",
//   isValid: true,
//   issues: []
// }
```

## API

### `normalizeKenteken(raw)`

Uppercases `raw` and removes every character except ASCII letters and digits.

### `formatKenteken(raw)`

Returns a normalized kenteken with RDW-style dash groups when the value matches one
of the supported series. Unknown 6-character shapes are returned normalized.

### `formatKentekenPartial(raw)`

Formats up to six normalized characters for live input fields. When a partial
value has a single matching series prefix, it uses that series' grouping.
Otherwise it falls back to simple letter/digit runs.

### `parseKenteken(raw)`

Returns normalized text, formatted text, series metadata, and validation issues.

Issue codes:

- `too_short`
- `too_long`
- `unknown_series`
- `disallowed_letter`
- `forbidden_combination`

### `isKenteken(raw)`

Convenience boolean around `parseKenteken(raw).isValid`.

### `KENTEKEN_SERIES`

Metadata for the supported Dutch kenteken series. Each item includes a series
number, display pattern, normalized mask, group lengths, and example.

## Rules and scope

The formatter supports 14 common Dutch kenteken series. Validation applies general
RDW-style letter and combination rules, but this package is not an issuance
check. It does not tell you whether a specific kenteken actually exists, belongs
to a specific vehicle category, or was issued on a specific date.

For vehicle data, use RDW open data or the official RDW kentekencheck. This
package is not affiliated with RDW.

The forbidden-combination list follows RDW's current public wording:

```ts
[
  "GVD",
  "KKK",
  "NSB",
  "PKK",
  "PSV",
  "TBS",
  "SS",
  "SD",
  "PVV",
  "SGP",
  "VVD",
  "FVD",
  "BBB",
]
```

Useful RDW references:

- https://www.rdw.nl/de-kentekenplaat/cijfers-en-letters-op-de-kentekenplaat
- https://www.rdw.nl/de-kentekenplaat/overzicht-van-kentekenseries

## Local development

Build the package:

```sh
npm run build
```

Run tests:

```sh
npm test
```

Create a local tarball for testing in another project:

```sh
npm pack
```

Install the generated tarball from another project:

```sh
npm install ../path/to/kenteken-kit-0.2.2.tgz
```

After publishing, install from npm:

```sh
npm install kenteken-kit
```

## Releasing

One version (`VERSION` at the repo root) drives both npm and Maven publishes.

### Bump and release

```sh
npm run version:bump patch   # or minor | major
git add VERSION package.json package-lock.json
git commit -m "Release v$(cat VERSION)"
git tag "v$(cat VERSION)"
git push origin main --tags
```

The **`ci.yml`** workflow then:

1. Runs npm + Kotlin tests and `npm run version:check`
2. Publishes to **npm** via [Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC, no `NPM_TOKEN`)
3. Publishes to **Maven Central** (`io.github.scan-kenteken:kenteken-kit`)

npm trusted publisher must list workflow **`ci.yml`** for **`scan-kenteken/kenteken-kit`**.

### GitHub secrets for Maven (Repository → Settings → Secrets)

| Secret | Purpose |
|---|---|
| `CENTRAL_PORTAL_USERNAME` | Portal user token username |
| `CENTRAL_PORTAL_PASSWORD` | Portal user token password |
| `SIGNING_KEY` | ASCII-armored PGP private key |
| `SIGNING_PASSWORD` | Only if your key has a passphrase (omit otherwise — GitHub rejects empty secrets) |

After CI uploads to Maven Central, open [central.sonatype.com/publishing](https://central.sonatype.com/publishing) to validate and click **Publish** (~15 min to sync).

### Manual sync check

```sh
npm run version:check
```

Existing codebases can also wrap the exports behind their own local adapter:

```ts
export {
  KENTEKEN_SERIES,
  formatKenteken as format,
  formatKentekenPartial as formatPartial,
  isKenteken as isValidDutchPlate,
  normalizeKenteken as normalize,
  parseKenteken,
} from "kenteken-kit";
```

## Kotlin

A Kotlin/JVM implementation is available in [`kotlin/`](./kotlin). See
[`kotlin/README.md`](./kotlin/README.md) for Kotlin usage and Maven publishing.

## License

MIT
