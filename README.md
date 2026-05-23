# Takhtescore

**Certified backgammon records — SHA-256 authenticated, hosted on GitHub Pages.**

Takhtescore is a static website that tracks backgammon match results between players. Every record is cryptographically certified with a SHA-256 hash, making tampering immediately detectable. There's no server, no database, and no dependencies — just HTML, CSS, vanilla JS, and a single JSON file.

---

## Live site

Once deployed, the site will be at:
`https://<your-github-username>.github.io/takhtescore/`

---

## File structure

```
takhtescore/
├── index.html            # Single-page site
├── css/
│   └── style.css         # All styles (retro board-game theme)
├── js/
│   └── main.js           # Data loading, rendering, hash verification
├── data/
│   └── matches.json      # All match records (edit this to add games)
├── scripts/
│   └── generate-hash.js  # Node.js helper — computes hashes for new records
└── README.md
```

---

## How to add a new match

### 1. Edit `scripts/generate-hash.js`

Open the file and fill in the `record` object at the top:

```js
const record = {
  id:      "match-007",          // unique, no spaces
  date:    "2025-06-01",         // YYYY-MM-DD
  player1: "Arash",
  player2: "Leila",
  score1:  5,
  score2:  4,
  winner:  "Arash",
  notes:   "Optional free text", // set to "" if none
};
```

### 2. Run the script

```bash
node scripts/generate-hash.js
```

It prints the canonical string that was hashed, then the full record with the `hash` field computed:

```json
{
  "id": "match-007",
  "date": "2025-06-01",
  ...
  "hash": "abc123def456..."
}
```

### 3. Paste into `data/matches.json`

Add the printed record as a new entry in the JSON array.

### 4. Push to `main`

```bash
git add data/matches.json
git commit -m "Add match-007: Arash vs Leila"
git push
```

GitHub Pages redeploys automatically. The new match appears on the site with a green **Certified** badge once the hash is verified in the browser.

---

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `takhtescore`)
2. Push this folder to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<you>/takhtescore.git
   git push -u origin main
   ```
3. Go to **Settings → Pages**
4. Under **Source**, select **Deploy from a branch → main → / (root)**
5. Click **Save**

GitHub Pages will build and serve the site at `https://<you>.github.io/takhtescore/` within a minute or two.

> **Note:** `fetch()` requires the page to be served over HTTP(S). Opening `index.html` directly from disk (`file://`) will fail to load `data/matches.json`. Use a local dev server:
> ```bash
> npx serve .
> # or
> python3 -m http.server
> ```

---

## How SHA-256 certification works

Each match record is locked with a cryptographic fingerprint:

1. **Canonicalize** — Take all fields in the record *except* `hash`, sort the keys alphabetically, and serialize to compact JSON (no extra whitespace).
   ```
   {"date":"2025-01-14","id":"match-001","notes":"Opening match...","player1":"Arash","player2":"Leila","score1":7,"score2":3,"winner":"Arash"}
   ```

2. **Hash** — Compute the SHA-256 digest of that string and store it as the `hash` field.

3. **Verify** — On every page load, the browser recomputes the digest for each record using the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) (`crypto.subtle.digest`) and compares it to the stored `hash`. A green **Certified** badge means the record is intact. A red **Hash mismatch** badge means something changed.

Because SHA-256 is a one-way function, even changing a single character anywhere in the record (a score, a name, a date, a space) produces a completely different hash. No server or trusted third party is needed — anyone with the JSON can independently verify every record.

### Verifying manually

The **Verify** section on the site lets you paste any JSON record and check its hash in real time, entirely in your browser.

You can also verify from the command line using `openssl` or any SHA-256 tool:

```bash
# 1. Print the canonical string (node outputs it when you run the hash script)
echo -n '{"date":"2025-01-14",...}' | shasum -a 256
```

---

## Customising

| What | Where |
|---|---|
| Players & matches | `data/matches.json` |
| Colors / fonts | `css/style.css` (CSS variables at top) |
| Site name / tagline | `index.html` header section |
| Hash logic | `js/main.js` — `canonicalize()` and `sha256hex()` |

---

## License

MIT — do whatever you like with it.
