const KENTEKEN_LENGTH = 6;

export type KentekenSideCodeNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14;

export type KentekenIssueCode =
  | "too_short"
  | "too_long"
  | "unknown_sidecode"
  | "disallowed_letter"
  | "forbidden_combination";

export interface KentekenSideCode {
  readonly sideCode: KentekenSideCodeNumber;
  readonly pattern: string;
  readonly mask: string;
  readonly groups: readonly [number, number, number];
  readonly example: string;
}

export interface KentekenIssue {
  readonly code: KentekenIssueCode;
  readonly message: string;
  readonly value?: string;
}

export interface KentekenParseResult {
  readonly input: string;
  readonly normalized: string;
  readonly formatted: string;
  readonly sideCode: KentekenSideCodeNumber | null;
  readonly sideCodePattern: string | null;
  readonly isValid: boolean;
  readonly issues: readonly KentekenIssue[];
}

export const SIDE_CODES = [
  { sideCode: 1, pattern: "XX-99-99", mask: "LLDDDD", groups: [2, 2, 2], example: "HJ-12-34" },
  { sideCode: 2, pattern: "99-99-XX", mask: "DDDDLL", groups: [2, 2, 2], example: "12-34-HJ" },
  { sideCode: 3, pattern: "99-XX-99", mask: "DDLLDD", groups: [2, 2, 2], example: "12-HJ-34" },
  { sideCode: 4, pattern: "XX-99-XX", mask: "LLDDLL", groups: [2, 2, 2], example: "HJ-12-KL" },
  { sideCode: 5, pattern: "XX-XX-99", mask: "LLLLDD", groups: [2, 2, 2], example: "HJ-KL-12" },
  { sideCode: 6, pattern: "99-XX-XX", mask: "DDLLLL", groups: [2, 2, 2], example: "12-HJ-KL" },
  { sideCode: 7, pattern: "99-XXX-9", mask: "DDLLLD", groups: [2, 3, 1], example: "12-HJK-3" },
  { sideCode: 8, pattern: "9-XXX-99", mask: "DLLLDD", groups: [1, 3, 2], example: "1-HJK-23" },
  { sideCode: 9, pattern: "XX-999-X", mask: "LLDDDL", groups: [2, 3, 1], example: "HJ-123-K" },
  { sideCode: 10, pattern: "X-999-XX", mask: "LDDDLL", groups: [1, 3, 2], example: "H-123-JK" },
  { sideCode: 11, pattern: "XXX-99-X", mask: "LLLDDL", groups: [3, 2, 1], example: "HJK-12-L" },
  { sideCode: 12, pattern: "X-99-XXX", mask: "LDDLLL", groups: [1, 2, 3], example: "H-12-JKL" },
  { sideCode: 13, pattern: "9-XX-999", mask: "DLLDDD", groups: [1, 2, 3], example: "1-HJ-234" },
  { sideCode: 14, pattern: "999-XX-9", mask: "DDDLLD", groups: [3, 2, 1], example: "123-HJ-4" },
] as const satisfies readonly KentekenSideCode[];

export const FORBIDDEN_COMBINATIONS = [
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
] as const;

const ALWAYS_DISALLOWED_LETTERS = ["C", "Q"] as const;
const SIDE_CODE_4_PLUS_DISALLOWED_LETTERS = ["A", "E", "I", "O", "U"] as const;

export function normalizeKenteken(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatKenteken(raw: string): string {
  const normalized = normalizeKenteken(raw);

  if (normalized.length !== KENTEKEN_LENGTH) {
    return normalized;
  }

  const sideCode = findSideCode(normalized);
  return sideCode ? formatWithGroups(normalized, sideCode.groups) : formatByCharacterRuns(normalized);
}

export function formatKentekenPartial(raw: string): string {
  const normalized = normalizeKenteken(raw).slice(0, KENTEKEN_LENGTH);

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length === KENTEKEN_LENGTH) {
    return formatKenteken(normalized);
  }

  const candidates = SIDE_CODES.filter(({ mask }) => matchesMaskPrefix(normalized, mask));
  const candidate = candidates[0];

  if (candidates.length === 1 && candidate) {
    return formatWithGroups(normalized, candidate.groups);
  }

  return formatPartialByCharacterRuns(normalized);
}

export function parseKenteken(raw: string): KentekenParseResult {
  const normalized = normalizeKenteken(raw);
  const issues: KentekenIssue[] = [];
  let sideCode: KentekenSideCode | null = null;

  if (normalized.length < KENTEKEN_LENGTH) {
    issues.push({
      code: "too_short",
      message: "A kenteken must contain 6 letters or digits.",
    });
  } else if (normalized.length > KENTEKEN_LENGTH) {
    issues.push({
      code: "too_long",
      message: "A kenteken must contain 6 letters or digits.",
    });
  } else {
    sideCode = findSideCode(normalized);

    if (!sideCode) {
      issues.push({
        code: "unknown_sidecode",
        message: "The letters and digits do not match a supported Dutch sidecode.",
      });
    } else {
      issues.push(...findDisallowedLetterIssues(normalized, sideCode));
      issues.push(...findForbiddenCombinationIssues(normalized, sideCode));
    }
  }

  return {
    input: raw,
    normalized,
    formatted: normalized.length === KENTEKEN_LENGTH ? formatKenteken(normalized) : formatKentekenPartial(normalized),
    sideCode: sideCode?.sideCode ?? null,
    sideCodePattern: sideCode?.pattern ?? null,
    isValid: issues.length === 0,
    issues,
  };
}

export function isKenteken(raw: string): boolean {
  return parseKenteken(raw).isValid;
}

export const normalize = normalizeKenteken;
export const format = formatKenteken;
export const formatPartial = formatKentekenPartial;
export const isValidDutchPlate = isKenteken;

function findSideCode(normalized: string): KentekenSideCode | null {
  return SIDE_CODES.find(({ mask }) => matchesMask(normalized, mask)) ?? null;
}

function findDisallowedLetterIssues(normalized: string, sideCode: KentekenSideCode): KentekenIssue[] {
  const disallowedLetters = new Set<string>(ALWAYS_DISALLOWED_LETTERS);

  if (sideCode.sideCode >= 4) {
    for (const letter of SIDE_CODE_4_PLUS_DISALLOWED_LETTERS) {
      disallowedLetters.add(letter);
    }
  }

  const found = unique([...normalized].filter((char) => disallowedLetters.has(char)));

  return found.map((letter) => ({
    code: "disallowed_letter",
    message: `Letter "${letter}" is not used in this kenteken series.`,
    value: letter,
  }));
}

function findForbiddenCombinationIssues(normalized: string, sideCode: KentekenSideCode): KentekenIssue[] {
  const letterGroups = getLetterGroups(normalized, sideCode);
  const found = new Set<string>();

  for (const group of letterGroups) {
    for (const combination of FORBIDDEN_COMBINATIONS) {
      if (group.includes(combination)) {
        found.add(combination);
      }
    }
  }

  return [...found].map((combination) => ({
    code: "forbidden_combination",
    message: `Combination "${combination}" is not used on regular Dutch kentekens.`,
    value: combination,
  }));
}

function getLetterGroups(normalized: string, sideCode: KentekenSideCode): string[] {
  const parts = splitByGroups(normalized, sideCode.groups);
  const maskParts = splitByGroups(sideCode.mask, sideCode.groups);

  return parts.filter((_, index) => /^L+$/.test(maskParts[index] ?? ""));
}

function splitByGroups(value: string, groups: readonly [number, number, number]): string[] {
  const parts: string[] = [];
  let offset = 0;

  for (const groupSize of groups) {
    parts.push(value.slice(offset, offset + groupSize));
    offset += groupSize;
  }

  return parts;
}

function matchesMask(value: string, mask: string): boolean {
  return value.length === mask.length && matchesMaskPrefix(value, mask);
}

function matchesMaskPrefix(value: string, mask: string): boolean {
  return [...value].every((char, index) => matchesMaskCharacter(char, mask[index] ?? ""));
}

function matchesMaskCharacter(char: string, mask: string): boolean {
  return mask === "L" ? isAsciiLetter(char) : isAsciiDigit(char);
}

function isAsciiLetter(char: string): boolean {
  return char >= "A" && char <= "Z";
}

function isAsciiDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

function formatWithGroups(value: string, groups: readonly [number, number, number]): string {
  return splitByGroups(value, groups).filter(Boolean).join("-");
}

function formatByCharacterRuns(value: string): string {
  const groups = value.match(/[A-Z]+|\d+/g);
  return groups?.length === 3 ? groups.join("-") : value;
}

function formatPartialByCharacterRuns(value: string): string {
  const groups = value.match(/[A-Z]+|\d+/g);

  if (!groups) {
    return "";
  }

  return groups.map((group) => group.match(/.{1,2}/g)?.join("-") ?? group).join("-");
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
