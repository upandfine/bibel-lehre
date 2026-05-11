# Sicherheit & bekannte Vulnerabilities

## Stand 2026-05-08

`pnpm audit --prod` meldet **keine** Vulnerabilities — alles, was in das
Production-Bundle geht, ist clean.

`pnpm audit` (inkl. Dev-Deps) meldet **3 moderate** Findings, die alle
transitiv via `vitest`/`@vitest/coverage-v8` reinkommen:

| CVE | Paket | Pfad | Bewertung |
|---|---|---|---|
| [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | esbuild ≤0.24.2 | tsx → @esbuild-kit/esm-loader → esbuild | nicht relevant für Production-Bundle |
| [GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) | vite ≤6.4.1 | vitest → vite | nicht relevant für Production-Bundle |
| (3. Finding) | dito | dito | dito |

**Warum nicht direkt gefixt?** Der saubere Fix wäre `vitest@^3` — das ist
ein Major-Bump, der gegen die aktuelle Test-Suite ausgerollt und verifiziert
werden müsste. Da die Vulnerabilities ausschließlich Dev-Server-/Build-Wege
betreffen (kein Code wandert ins Sliplane-Image), ist das Risiko bei der
aktuellen Konstellation minimal:

- esbuild-Dev-Server (durch tsx beim Seed-Lauf) wird nur lokal benutzt.
- vite läuft nur in der Vitest-Test-Runtime, ebenfalls lokal.
- Das Sliplane-Image baut mit Next.js und enthält weder vitest noch tsx
  (siehe `Dockerfile`-Stage).

**Wann fixen?** Bei der nächsten Test-Stack-Modernisierung mit eigenem
Verifikations-Pass — nicht inline mit Inhalts-Arbeit.

## Production-Verifikation

```bash
pnpm audit --prod   # muss 0 Vulnerabilities zeigen
```

Diese Prüfung läuft auch in CI (`.github/workflows/ci.yml`).
