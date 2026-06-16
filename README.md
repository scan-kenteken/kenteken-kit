# kenteken-kit

Tiny Dutch kenteken formatting, parsing, and validation for JavaScript and TypeScript.

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
npm install ../path/to/kenteken-kit-0.2.0.tgz
```

After publishing, install from npm:

```sh
npm install kenteken-kit
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

## License

MIT
