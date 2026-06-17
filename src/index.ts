const KENTEKEN_LENGTH = 6;
const EXAMPLE_LETTERS = "HJKLMN";
const EXAMPLE_DIGITS = "123456";

type SeriesGroups = readonly [string, string, string];
type GroupSizes = readonly [number, number, number];

const SERIES_GROUPS = [
  ["LL", "DD", "DD"],
  ["DD", "DD", "LL"],
  ["DD", "LL", "DD"],
  ["LL", "DD", "LL"],
  ["LL", "LL", "DD"],
  ["DD", "LL", "LL"],
  ["DD", "LLL", "D"],
  ["D", "LLL", "DD"],
  ["LL", "DDD", "L"],
  ["L", "DDD", "LL"],
  ["LLL", "DD", "L"],
  ["L", "DD", "LLL"],
  ["D", "LL", "DDD"],
  ["DDD", "LL", "D"],
] as const satisfies readonly SeriesGroups[];

export type KentekenSeriesNumber =
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

// Compile-time guard: the highest KentekenSeriesNumber must equal the number of
// defined series, so the two can't silently drift apart.
const _seriesCountOk: (typeof SERIES_GROUPS)["length"] extends 14 ? true : never = true;
void _seriesCountOk;

export type KentekenIssueCode =
  | "too_short"
  | "too_long"
  | "unknown_series"
  | "disallowed_letter"
  | "forbidden_combination";

export interface KentekenSeries {
  readonly series: KentekenSeriesNumber;
  readonly pattern: string;
  readonly mask: string;
  readonly groups: GroupSizes;
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
  readonly series: KentekenSeriesNumber | null;
  readonly seriesPattern: string | null;
  readonly isValid: boolean;
  readonly issues: readonly KentekenIssue[];
}

export const KENTEKEN_SERIES: readonly KentekenSeries[] = SERIES_GROUPS.map((groups, index) =>
  createSeries((index + 1) as KentekenSeriesNumber, groups),
);

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
const SERIES_4_PLUS_DISALLOWED_LETTERS = ["A", "E", "I", "O", "U"] as const;

export function normalizeKenteken(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatKenteken(raw: string): string {
  const normalized = normalizeKenteken(raw);

  if (normalized.length !== KENTEKEN_LENGTH) {
    return normalized;
  }

  return formatNormalized(normalized, findSeries(normalized));
}

export function formatKentekenPartial(raw: string): string {
  const normalized = normalizeKenteken(raw).slice(0, KENTEKEN_LENGTH);

  if (normalized.length === 0) {
    return "";
  }

  if (normalized.length === KENTEKEN_LENGTH) {
    return formatNormalized(normalized, findSeries(normalized));
  }

  const candidates = KENTEKEN_SERIES.filter(({ mask }) => matchesMaskPrefix(normalized, mask));
  const candidate = candidates[0];

  if (candidates.length === 1 && candidate) {
    return formatWithGroups(normalized, candidate.groups);
  }

  return formatPartialByCharacterRuns(normalized);
}

export function parseKenteken(raw: string): KentekenParseResult {
  const normalized = normalizeKenteken(raw);
  const issues: KentekenIssue[] = [];
  let series: KentekenSeries | null = null;

  if (normalized.length !== KENTEKEN_LENGTH) {
    issues.push({
      code: normalized.length < KENTEKEN_LENGTH ? "too_short" : "too_long",
      message: "A kenteken must contain 6 letters or digits.",
    });
  } else {
    series = findSeries(normalized);

    if (!series) {
      issues.push({
        code: "unknown_series",
        message: "The letters and digits do not match a supported Dutch kenteken series.",
      });
    } else {
      issues.push(...findDisallowedLetterIssues(normalized, series));
      issues.push(...findForbiddenCombinationIssues(normalized, series));
    }
  }

  return {
    input: raw,
    normalized,
    formatted: formatParsedValue(normalized, series),
    series: series?.series ?? null,
    seriesPattern: series?.pattern ?? null,
    isValid: issues.length === 0,
    issues,
  };
}

export function isKenteken(raw: string): boolean {
  return parseKenteken(raw).isValid;
}

function createSeries(series: KentekenSeriesNumber, groups: SeriesGroups): KentekenSeries {
  return {
    series,
    pattern: groups.map(formatPatternGroup).join("-"),
    mask: groups.join(""),
    groups: groupSizes(groups),
    example: groups.map(formatExampleGroup).join("-"),
  };
}

function groupSizes(groups: SeriesGroups): GroupSizes {
  return [groups[0].length, groups[1].length, groups[2].length];
}

function formatPatternGroup(group: string): string {
  return group.replace(/L/g, "X").replace(/D/g, "9");
}

function formatExampleGroup(group: string): string {
  const sample = group[0] === "L" ? EXAMPLE_LETTERS : EXAMPLE_DIGITS;
  return sample.slice(0, group.length);
}

function formatParsedValue(normalized: string, series: KentekenSeries | null): string {
  if (normalized.length < KENTEKEN_LENGTH) {
    return formatKentekenPartial(normalized);
  }

  if (normalized.length === KENTEKEN_LENGTH) {
    return formatNormalized(normalized, series);
  }

  return normalized;
}

function formatNormalized(normalized: string, series: KentekenSeries | null): string {
  return series ? formatWithGroups(normalized, series.groups) : formatByCharacterRuns(normalized);
}

const SERIES_PATTERNS = new Map(KENTEKEN_SERIES.map((s) => [s, maskToRegExp(s.mask)]));

function findSeries(normalized: string): KentekenSeries | null {
  return KENTEKEN_SERIES.find((s) => SERIES_PATTERNS.get(s)!.test(normalized)) ?? null;
}

function findDisallowedLetterIssues(normalized: string, series: KentekenSeries): KentekenIssue[] {
  const disallowedLetters = new Set<string>(ALWAYS_DISALLOWED_LETTERS);

  if (series.series >= 4) {
    for (const letter of SERIES_4_PLUS_DISALLOWED_LETTERS) {
      disallowedLetters.add(letter);
    }
  }

  return [...new Set([...normalized].filter((char) => disallowedLetters.has(char)))].map((letter) => ({
    code: "disallowed_letter",
    message: `Letter "${letter}" is not used in this kenteken series.`,
    value: letter,
  }));
}

function findForbiddenCombinationIssues(normalized: string, series: KentekenSeries): KentekenIssue[] {
  const found = new Set<string>();

  for (const group of getLetterGroups(normalized, series)) {
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

function getLetterGroups(normalized: string, series: KentekenSeries): string[] {
  return splitByGroups(normalized, series.groups).filter((group) => /^[A-Z]+$/.test(group));
}

function splitByGroups(value: string, groups: GroupSizes): string[] {
  const parts: string[] = [];
  let offset = 0;

  for (const groupSize of groups) {
    parts.push(value.slice(offset, offset + groupSize));
    offset += groupSize;
  }

  return parts;
}

function maskCharClass(maskChar: string): string {
  if (maskChar === "L") return "[A-Z]";
  if (maskChar === "D") return "[0-9]";
  return "";
}

function maskToRegExp(mask: string): RegExp {
  return new RegExp(`^${[...mask].map(maskCharClass).join("")}$`);
}

function matchesMaskPrefix(value: string, mask: string): boolean {
  const prefix = [...mask].slice(0, value.length).map(maskCharClass).join("");
  return new RegExp(`^${prefix}$`).test(value);
}

function formatWithGroups(value: string, groups: GroupSizes): string {
  return splitByGroups(value, groups).filter(Boolean).join("-");
}

function splitCharacterRuns(value: string): RegExpMatchArray | null {
  return value.match(/[A-Z]+|\d+/g);
}

function formatByCharacterRuns(value: string): string {
  const groups = splitCharacterRuns(value);
  return groups?.length === 3 ? groups.join("-") : value;
}

function formatPartialByCharacterRuns(value: string): string {
  const groups = splitCharacterRuns(value);

  if (!groups) {
    return "";
  }

  return groups.map((group) => group.match(/.{1,2}/g)?.join("-") ?? group).join("-");
}
