#!/usr/bin/env node
/**
 * generate-hash.js
 * Usage: node scripts/generate-hash.js
 *
 * Edit the `record` object below, then run this script.
 * It computes the SHA-256 hash and prints the full record
 * with the `hash` field filled in — ready to paste into data/matches.json.
 */

const crypto = require("crypto");

// ── Edit this record ──────────────────────────────────────────────────────────
const record = {
  id: "match-007",
  date: "2025-06-01",
  player1: "Arash",
  player2: "Leila",
  score1: 5,
  score2: 4,
  winner: "Arash",
  notes: "Tiebreaker match — went to extra game",
};
// ─────────────────────────────────────────────────────────────────────────────

function canonicalize(obj) {
  // All fields except 'hash', keys sorted alphabetically, no extra whitespace
  const sorted = Object.keys(obj)
    .filter((k) => k !== "hash")
    .sort()
    .reduce((acc, k) => {
      acc[k] = obj[k];
      return acc;
    }, {});
  return JSON.stringify(sorted);
}

const canonical = canonicalize(record);
const hash = crypto.createHash("sha256").update(canonical).digest("hex");

const full = { ...record, hash };

console.log("\n── Canonical string that was hashed ──────────────────────────");
console.log(canonical);
console.log("\n── Full record with hash (paste into data/matches.json) ──────");
console.log(JSON.stringify(full, null, 2));
console.log("");
