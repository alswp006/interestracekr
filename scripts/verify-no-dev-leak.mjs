#!/usr/bin/env node
// verify-no-dev-leak.mjs — Assert dev-only code is excluded from production build.
//
// Usage: node scripts/verify-no-dev-leak.mjs [dist-dir]
//   default dist-dir = ./dist
//
// Cross-platform Node version (no bash dependency). Wired into npm postbuild
// hook in package.json so every `npm run build` automatically verifies.
//
// Exit 0 = clean (no leak). Exit 1 = leak detected.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const distDir = process.argv[2] ?? "dist";

if (!existsSync(distDir)) {
  console.error(`✗ ERROR: dist directory not found: ${distDir}`);
  process.exit(2);
}

// Patterns that should NEVER appear in production bundle
const LEAK_PATTERNS = [
  "TdsGallery",
  "__tds-gallery",
];

// Files to scan
const SCAN_EXTENSIONS = [".js", ".html", ".css"];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      yield* walk(full);
    } else if (SCAN_EXTENSIONS.some((ext) => full.endsWith(ext))) {
      yield full;
    }
  }
}

let foundAny = false;

for (const pattern of LEAK_PATTERNS) {
  let matchCount = 0;
  for (const file of walk(distDir)) {
    const content = readFileSync(file, "utf8");
    let idx = 0;
    while ((idx = content.indexOf(pattern, idx)) !== -1) {
      matchCount++;
      idx += pattern.length;
    }
  }
  if (matchCount > 0) {
    console.error(`✗ LEAK: '${pattern}' found ${matchCount} time(s) in ${distDir}`);
    foundAny = true;
  } else {
    console.log(`✓ '${pattern}' not found in production bundle`);
  }
}

if (foundAny) {
  console.error("");
  console.error("Dev-only code leaked into production build. Possible causes:");
  console.error("  - import.meta.env.DEV check missing or short-circuited");
  console.error("  - lazy() not wrapped in DEV conditional");
  console.error("  - direct static import of dev-only file outside the conditional");
  process.exit(1);
}

console.log("");
console.log("✓ All dev-only patterns absent from production bundle.");
