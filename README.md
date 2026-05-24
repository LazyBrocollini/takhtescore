# Takhtescore

**Certified backgammon records — SHA-256 authenticated, hosted on GitHub Pages.**

Takhtescore is a static website that tracks backgammon match results between players. Every record is cryptographically certified with a SHA-256 hash, making tampering immediately detectable. There's no server, no database, and no dependencies — just HTML, CSS, vanilla JS, and a single JSON file.
---

### Verifying manually

The **Verify** section on the site lets you paste any JSON record and check its hash in real time, entirely in your browser.

You can also verify from the command line using `openssl` or any SHA-256 tool:

```bash
# 1. Print the canonical string (node outputs it when you run the hash script)
echo -n '{"date":"2025-01-14",...}' | shasum -a 256
```

