/**
 * Takhtescore — main.js
 * Loads data/matches.json, renders leaderboard + match log,
 * verifies SHA-256 hashes, and powers the Verify tool.
 */

/* ── Crypto helpers ──────────────────────────────────────────────────────── */

/**
 * Canonical JSON of a match record (no `hash` field, keys sorted).
 */
function canonicalize(record) {
  const obj = Object.keys(record)
    .filter((k) => k !== "hash")
    .sort()
    .reduce((acc, k) => {
      acc[k] = record[k];
      return acc;
    }, {});
  return JSON.stringify(obj);
}

/**
 * SHA-256 hex digest of a string via Web Crypto API.
 */
async function sha256hex(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a record's hash field against a freshly computed digest.
 * Returns { valid: bool, computed: string }
 */
async function verifyRecord(record) {
  const computed = await sha256hex(canonicalize(record));
  return { valid: computed === record.hash, computed };
}

/* ── Data loading ────────────────────────────────────────────────────────── */

async function loadMatches() {
  const res = await fetch("data/matches.json");
  if (!res.ok) throw new Error(`Failed to load matches.json: ${res.status}`);
  return res.json();
}

/* ── Leaderboard ─────────────────────────────────────────────────────────── */

function buildLeaderboard(matches) {
  const players = {};

  for (const m of matches) {
    for (const name of [m.player1, m.player2]) {
      if (!players[name]) players[name] = { name, wins: 0, losses: 0 };
    }
    players[m.winner].wins++;
    const loser = m.winner === m.player1 ? m.player2 : m.player1;
    players[loser].losses++;
  }

  return Object.values(players)
    .map((p) => ({
      ...p,
      total: p.wins + p.losses,
      pct: p.wins + p.losses > 0 ? p.wins / (p.wins + p.losses) : 0,
    }))
    .sort((a, b) => b.pct - a.pct || b.wins - a.wins);
}

function renderLeaderboard(players) {
  const rankIcons = ["🥇", "🥈", "🥉"];

  const rows = players
    .map(
      (p, i) => `
    <tr class="fade-in">
      <td>
        <span class="lb-rank lb-rank-${i + 1}">
          ${rankIcons[i] || `#${i + 1}`}
        </span>
        <span class="lb-name">${esc(p.name)}</span>
      </td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${p.total}</td>
      <td>
        <div class="win-bar-wrap">
          <div class="win-bar">
            <div class="win-bar-fill" style="width:${Math.round(p.pct * 100)}%"></div>
          </div>
          <span class="lb-pct">${Math.round(p.pct * 100)}%</span>
        </div>
      </td>
    </tr>`
    )
    .join("");

  document.getElementById("leaderboard-body").innerHTML = rows;
}

/* ── Match log ───────────────────────────────────────────────────────────── */

function renderMatchLog(matches) {
  const container = document.getElementById("match-list");

  // Newest first
  const sorted = [...matches].sort((a, b) => b.date.localeCompare(a.date));

  container.innerHTML = sorted
    .map(
      (m) => `
    <article class="match-card fade-in" data-id="${esc(m.id)}">
      <div class="match-card-top">
        <div>
          <div class="match-players">
            ${esc(m.player1)} <span style="color:var(--walnut-lt);font-style:italic;font-weight:400">vs</span> ${esc(m.player2)}
          </div>
          <div class="match-meta">
            <span class="match-date">${esc(m.date)}</span>
            <span class="match-winner">▶ ${esc(m.winner)} wins</span>
          </div>
          ${m.notes ? `<div class="match-notes">${esc(m.notes)}</div>` : ""}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem">
          <span class="match-score">${m.score1} – ${m.score2}</span>
          <span class="cert-badge pending" id="badge-${esc(m.id)}">
            <span>⏳</span> Verifying…
          </span>
        </div>
      </div>
      <div class="match-hash">
        <span class="hash-label">SHA-256</span>
        <span class="hash-value mono">${esc(m.hash)}</span>
      </div>
    </article>`
    )
    .join("");

  return sorted;
}

async function verifyAllMatches(matches) {
  for (const m of matches) {
    const { valid, computed } = await verifyRecord(m);
    const badge = document.getElementById(`badge-${m.id}`);
    if (!badge) continue;
    if (valid) {
      badge.className = "cert-badge valid";
      badge.innerHTML = `<span>✓</span> Certified`;
      badge.title = `SHA-256 verified: ${computed}`;
    } else {
      badge.className = "cert-badge invalid";
      badge.innerHTML = `<span>✗</span> Hash mismatch`;
      badge.title = `Expected: ${m.hash}\nComputed: ${computed}`;
    }
  }
}

/* ── Verify tool ─────────────────────────────────────────────────────────── */

async function runVerify() {
  const input = document.getElementById("verify-input").value.trim();
  const result = document.getElementById("verify-result");
  result.className = ""; // clear classes
  result.classList.add("show");

  if (!input) {
    result.className = "show error";
    result.innerHTML = `<div class="verify-result-title">⚠ No input</div>Paste a JSON match record above.`;
    return;
  }

  let record;
  try {
    record = JSON.parse(input);
  } catch (e) {
    result.className = "show error";
    result.innerHTML = `<div class="verify-result-title">⚠ Invalid JSON</div>${esc(e.message)}`;
    return;
  }

  if (!record.hash) {
    result.className = "show error";
    result.innerHTML = `<div class="verify-result-title">⚠ Missing hash field</div>The record must include a "hash" field.`;
    return;
  }

  const { valid, computed } = await verifyRecord(record);

  if (valid) {
    result.className = "show valid";
    result.innerHTML = `
      <div class="verify-result-title">✓ Hash verified — record is authentic</div>
      <div class="verify-hash-row"><strong>Match ID:</strong> ${esc(record.id || "—")}</div>
      <div class="verify-hash-row"><strong>SHA-256:</strong> ${esc(computed)}</div>`;
  } else {
    result.className = "show invalid";
    result.innerHTML = `
      <div class="verify-result-title">✗ Hash mismatch — record may have been altered</div>
      <div class="verify-hash-row"><strong>Stored hash: </strong>${esc(record.hash)}</div>
      <div class="verify-hash-row"><strong>Computed:    </strong>${esc(computed)}</div>`;
  }
}

function clearVerify() {
  document.getElementById("verify-input").value = "";
  const result = document.getElementById("verify-result");
  result.className = "";
  result.innerHTML = "";
}

/* ── Utilities ───────────────────────────────────────────────────────────── */

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Bootstrap ───────────────────────────────────────────────────────────── */

async function init() {
  // Wire up Verify tool
  document.getElementById("verify-btn").addEventListener("click", runVerify);
  document.getElementById("verify-clear").addEventListener("click", clearVerify);
  document.getElementById("verify-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runVerify();
  });

  let matches;
  try {
    matches = await loadMatches();
  } catch (err) {
    document.getElementById("leaderboard-body").innerHTML =
      `<tr><td colspan="5" class="loading">Failed to load match data — ${esc(err.message)}</td></tr>`;
    document.getElementById("match-list").innerHTML =
      `<p class="loading">Failed to load match data.</p>`;
    console.error(err);
    return;
  }

  // Leaderboard
  const players = buildLeaderboard(matches);
  renderLeaderboard(players);

  // Match log — render then verify async
  const sorted = renderMatchLog(matches);
  verifyAllMatches(sorted); // fire and forget
}

document.addEventListener("DOMContentLoaded", init);
