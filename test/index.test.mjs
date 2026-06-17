import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  FORBIDDEN_COMBINATIONS,
  KENTEKEN_SERIES,
  formatKenteken,
  formatKentekenPartial,
  isKenteken,
  normalizeKenteken,
  parseKenteken,
} from "../dist/index.js";

const fixturesPath = new URL("../fixtures/plates.shared.json", import.meta.url);
const fixtures = JSON.parse(readFileSync(fileURLToPath(fixturesPath), "utf8"));

describe("normalizeKenteken", () => {
  it("uppercases and strips separators", () => {
    assert.equal(normalizeKenteken(" kjr-50.s "), "KJR50S");
  });
});

describe("formatKenteken", () => {
  for (const { raw, formatted, series } of fixtures.valid) {
    it(`formats series ${series}`, () => {
      assert.equal(formatKenteken(raw), formatted);
      assert.equal(parseKenteken(raw).series, series);
    });
  }

  it("exports derived series metadata", () => {
    assert.equal(KENTEKEN_SERIES.length, 14);
    assert.equal(KENTEKEN_SERIES[9].pattern, "X-999-XX");
    assert.equal(KENTEKEN_SERIES[9].mask, "LDDDLL");
    assert.deepEqual(KENTEKEN_SERIES[9].groups, [1, 3, 2]);
  });
});

describe("formatKentekenPartial", () => {
  for (const { raw, formatted } of fixtures.partial) {
    it(`formats partial input: ${raw}`, () => {
      assert.equal(formatKentekenPartial(raw), formatted);
    });
  }
});

describe("parseKenteken", () => {
  it("accepts a current-looking kenteken", () => {
    const parsed = parseKenteken("G-001-BB");

    assert.equal(parsed.isValid, true);
    assert.equal(parsed.normalized, "G001BB");
    assert.equal(parsed.formatted, "G-001-BB");
    assert.equal(parsed.series, 10);
    assert.equal(parsed.seriesPattern, "X-999-XX");
    assert.deepEqual(parsed.issues, []);
  });

  it("allows vowels in older series before series 4", () => {
    assert.equal(isKenteken("AB-12-34"), true);
  });

  it("rejects disallowed letters in series 4 and newer", () => {
    const parsed = parseKenteken("A-001-QC");

    assert.equal(parsed.isValid, false);
    assert.deepEqual(
      parsed.issues.map((issue) => [issue.code, issue.value]),
      [
        ["disallowed_letter", "A"],
        ["disallowed_letter", "Q"],
        ["disallowed_letter", "C"],
      ],
    );
  });

  it("rejects forbidden combinations inside one letter group", () => {
    const parsed = parseKenteken("99-PVV-9");

    assert.equal(parsed.isValid, false);
    assert.deepEqual(
      parsed.issues.map((issue) => [issue.code, issue.value]),
      [["forbidden_combination", "PVV"]],
    );
  });

  it("keeps the RDW forbidden-combination list covered", () => {
    assert.deepEqual([...FORBIDDEN_COMBINATIONS], [
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
    ]);

    for (const { combination, plate } of fixtures.forbidden) {
      assert.equal(
        parseKenteken(plate).issues.some((issue) => issue.code === "forbidden_combination" && issue.value === combination),
        true,
        `${combination} should be rejected`,
      );
    }
  });

  it("does not join forbidden combinations across separated letter groups", () => {
    assert.equal(isKenteken("99-HK-KK"), true);
  });

  it("reports length and shape problems", () => {
    for (const { raw, codes } of fixtures.invalid) {
      assert.deepEqual(parseKenteken(raw).issues.map((issue) => issue.code), codes);
    }
  });
});
