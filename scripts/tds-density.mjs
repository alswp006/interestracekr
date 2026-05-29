#!/usr/bin/env node
// tds-density.mjs — Measure TDS-component vs raw-HTML usage ratio.
//
// Usage: node scripts/tds-density.mjs [src-dir ...]
//   default = ./src
//
// Counts opening tags in .tsx files (excluding node_modules, __tests__, dist)
// and reports density score: TDS / (TDS + raw HTML). Higher = more TDS adoption.
//
// Cross-platform Node version. Wired as `npm run measure:tds` (opt-in,
// not run on every build).

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

// TDS components from @toss/tds-mobile (.d.ts verified)
const TDS_PATTERN = /<(Top|Button|TextField|TextArea|TextButton|ListRow|Tab|TabBar|Switch|Checkbox|Radio|IconButton|Asset|AlertDialog|BottomSheet|Toast|Spacing|Paragraph|Badge|Border|Skeleton|Modal|Chip|SearchField|SegmentedControl|ProgressBar|ProgressStep|Loader|FullScreenLoader|Tooltip|CTAButton|BottomCTA|FixedBottomCTA|Selector|Stepper|TableRow|Result|Rating|Bubble|Menu|GridList|Slider)\b/g;

// Raw HTML elements (layout glue like <br>, <hr> excluded)
const RAW_PATTERN = /<(div|span|p|h1|h2|h3|h4|h5|h6|button|input|label|select|textarea|ul|ol|li|a|img|section|article|header|footer|nav|main|aside|form)\b/g;

const SKIP_DIRS = new Set(["node_modules", "__tests__", "dist", ".next", "build"]);

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      yield* walk(full);
    } else if (full.endsWith(".tsx")) {
      yield full;
    }
  }
}

function countMatches(content, pattern) {
  let count = 0;
  pattern.lastIndex = 0;
  while (pattern.exec(content) !== null) count++;
  return count;
}

function analyzeProject(dir) {
  if (!existsSync(dir)) {
    return { dir, files: 0, tds: 0, raw: 0, density: null };
  }
  let files = 0;
  let tds = 0;
  let raw = 0;
  for (const file of walk(dir)) {
    files++;
    const content = readFileSync(file, "utf8");
    tds += countMatches(content, TDS_PATTERN);
    raw += countMatches(content, RAW_PATTERN);
  }
  const total = tds + raw;
  const density = total === 0 ? null : tds / total;
  return { dir, files, tds, raw, density };
}

const dirs = process.argv.slice(2);
if (dirs.length === 0) dirs.push("src");

const header = ["PROJECT", "FILES", "TDS", "HTML", "DENSITY"];
const rows = dirs.map(analyzeProject).map((r) => [
  r.dir,
  String(r.files),
  String(r.tds),
  String(r.raw),
  r.density === null ? "n/a" : r.density.toFixed(3),
]);

const widths = header.map((h, i) =>
  Math.max(h.length, ...rows.map((r) => r[i].length)),
);

const fmt = (cells) =>
  cells.map((c, i) => i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i])).join("  ");

console.log(fmt(header));
console.log(widths.map((w) => "-".repeat(w)).join("  "));
for (const row of rows) console.log(fmt(row));
