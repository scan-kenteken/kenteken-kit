import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FORBIDDEN_COMBINATIONS,
  SIDE_CODES,
  format,
  formatKenteken,
  formatKentekenPartial,
  isKenteken,
  normalize,
  parseKenteken,
} from "../dist/index.js";

describe("normalizeKenteken", () => {
  it("uppercases and strips separators", () => {
    assert.equal(normalize(" kjr-50.s "), "KJR50S");
  });
});

describe("formatKenteken", () => {
  const examples = [
    ["HJ1234", "HJ-12-34", 1],
    ["1234HJ", "12-34-HJ", 2],
    ["12HJ34", "12-HJ-34", 3],
    ["HJ12KL", "HJ-12-KL", 4],
    ["HJKL12", "HJ-KL-12", 5],
    ["12HJKL", "12-HJ-KL", 6],
    ["12HJK3", "12-HJK-3", 7],
    ["1HJK23", "1-HJK-23", 8],
    ["HJ123K", "HJ-123-K", 9],
    ["H123JK", "H-123-JK", 10],
    ["HJK12L", "HJK-12-L", 11],
    ["H12JKL", "H-12-JKL", 12],
    ["1HJ234", "1-HJ-234", 13],
    ["123HJ4", "123-HJ-4", 14],
  ];

  for (const [raw, formatted, sideCode] of examples) {
    it(`formats sidecode ${sideCode}`, () => {
      assert.equal(formatKenteken(raw), formatted);
      assert.equal(parseKenteken(raw).sideCode, sideCode);
    });
  }

  it("exports sidecode metadata", () => {
    assert.equal(SIDE_CODES.length, 14);
    assert.equal(SIDE_CODES[9].pattern, "X-999-XX");
  });
});

describe("formatKentekenPartial", () => {
  it("formats unambiguous partial input", () => {
    assert.equal(formatKentekenPartial("kjr5"), "KJR-5");
    assert.equal(formatKentekenPartial("g001"), "G-001");
  });

  it("falls back to character runs for ambiguous partial input", () => {
    assert.equal(formatKentekenPartial("ab"), "AB");
    assert.equal(formatKentekenPartial("12ab"), "12-AB");
  });
});

describe("parseKenteken", () => {
  it("accepts a current-looking kenteken", () => {
    const parsed = parseKenteken("G-001-BB");

    assert.equal(parsed.isValid, true);
    assert.equal(parsed.normalized, "G001BB");
    assert.equal(parsed.formatted, "G-001-BB");
    assert.equal(parsed.sideCode, 10);
    assert.deepEqual(parsed.issues, []);
  });

  it("allows vowels in older sidecodes before sidecode 4", () => {
    assert.equal(isKenteken("AB-12-34"), true);
  });

  it("rejects disallowed letters in sidecode 4 and newer", () => {
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

    const sampleByCombination = {
      GVD: "99-GVD-9",
      KKK: "99-KKK-9",
      NSB: "99-NSB-9",
      PKK: "99-PKK-9",
      PSV: "99-PSV-9",
      TBS: "99-TBS-9",
      SS: "12-SS-34",
      SD: "12-SD-34",
      PVV: "99-PVV-9",
      SGP: "99-SGP-9",
      VVD: "99-VVD-9",
      FVD: "99-FVD-9",
      BBB: "99-BBB-9",
    };

    for (const [combination, plate] of Object.entries(sampleByCombination)) {
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
    assert.deepEqual(parseKenteken("AB-12").issues.map((issue) => issue.code), ["too_short"]);
    assert.deepEqual(parseKenteken("AB-12-34-56").issues.map((issue) => issue.code), ["too_long"]);
    assert.deepEqual(parseKenteken("ABC-123").issues.map((issue) => issue.code), ["unknown_sidecode"]);
  });
});
