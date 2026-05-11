#!/usr/bin/env bash
#
# Smoke-Test für die Production-Build-Auslieferung.
#
# Lehre aus 2026-05-08: `pnpm build` + `curl /` allein deckt RSC-Crashes
# auf geschützten Routen nicht auf (Drizzle-Date-Bug, kaputte Repository-
# Queries, Hydration-Mismatch). Dieses Script:
#
#   1. baut die App (production mode)
#   2. startet `next start` auf Port 3070
#   3. legt eine Test-Session direkt in der lokalen DB an
#   4. ruft mit Session-Cookie alle relevanten Routen ab
#   5. prüft den HTML-Body auf ErrorBoundary-Marker
#   6. räumt die Session wieder ab
#
# Verlangt: lokales Postgres läuft als Container `bibinside-postgres`,
# Admin-User existiert (siehe `pnpm db:seed`).
#
# Aufruf: `pnpm smoke`

set -euo pipefail

PORT=3070
ROUTES=(
  "/"
  "/sign-in"
  "/dashboard"
  "/verse"
  "/uebungen"
  "/uebungen/buecher-reihenfolge"
  "/uebungen/buecher-reihenfolge/AT"
  "/lehrkurs"
  "/lehrkurs/1"
  "/lehrkurs/1/1"
)

# Cleanup-Hook
SERVER_PID=""
SESSION_TOKEN=""
cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ -n "$SESSION_TOKEN" ]]; then
    docker exec bibinside-postgres psql -U bibinside -d bibinside \
      -c "DELETE FROM sessions WHERE session_token='$SESSION_TOKEN';" \
      > /dev/null 2>&1 || true
  fi
  rm -f /tmp/smoke-body.html /tmp/smoke-server.log
}
trap cleanup EXIT INT TERM

# --- Vorbedingungen prüfen ---
echo "→ Vorbedingungen…"
if ! docker exec bibinside-postgres pg_isready -U bibinside > /dev/null 2>&1; then
  echo "✗ Lokales Postgres (bibinside-postgres) läuft nicht."
  echo "  Starte mit: docker compose up -d"
  exit 1
fi

USER_ID=$(docker exec bibinside-postgres psql -U bibinside -d bibinside -t -A \
  -c "SELECT id FROM users LIMIT 1;" 2>/dev/null)
if [[ -z "$USER_ID" ]]; then
  echo "✗ Kein User in der DB. Run \`pnpm db:seed\` zuerst."
  exit 1
fi

# --- Build ---
echo "→ pnpm build…"
if ! pnpm build > /tmp/smoke-build.log 2>&1; then
  echo "✗ Build fehlgeschlagen. Letzte Zeilen:"
  tail -30 /tmp/smoke-build.log
  exit 1
fi

# --- Server starten ---
echo "→ Production-Server starten auf Port $PORT…"
PORT=$PORT pnpm start > /tmp/smoke-server.log 2>&1 &
SERVER_PID=$!

# Warten bis Server bereit (max 30s)
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "✗ Server hat sich beendet. Logs:"
    tail -30 /tmp/smoke-server.log
    exit 1
  fi
  sleep 1
done

if ! curl -sf "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
  echo "✗ Server nach 30s nicht erreichbar. Logs:"
  tail -30 /tmp/smoke-server.log
  exit 1
fi

# --- Session in DB anlegen ---
SESSION_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EXPIRES=$(node -e "console.log(new Date(Date.now()+86400*1000).toISOString())")
docker exec bibinside-postgres psql -U bibinside -d bibinside \
  -c "INSERT INTO sessions (session_token, user_id, expires) VALUES ('$SESSION_TOKEN', '$USER_ID', '$EXPIRES');" \
  > /dev/null

# --- Routes abfahren ---
echo "→ Routen prüfen…"
FAILED=0
for r in "${ROUTES[@]}"; do
  STATUS=$(curl -s -o /tmp/smoke-body.html -w "%{http_code}" \
    --cookie "next-auth.session-token=$SESSION_TOKEN" \
    "http://localhost:$PORT$r")

  ERROR_MARKER=""
  if grep -q "Etwas ist schiefgelaufen" /tmp/smoke-body.html 2>/dev/null; then
    ERROR_MARKER=" (ErrorBoundary aktiviert)"
  fi

  # 2xx und 3xx sind beide OK — `/` redirected z.B. eingeloggte User zum
  # Dashboard, das ist erwartetes Verhalten.
  if [[ "$STATUS" -ge 400 || -n "$ERROR_MARKER" ]]; then
    echo "  ✗ $r → HTTP $STATUS$ERROR_MARKER"
    FAILED=$((FAILED + 1))
  else
    echo "  ✓ $r → $STATUS"
  fi
done

if [[ $FAILED -gt 0 ]]; then
  echo ""
  echo "✗ Smoke-Test fehlgeschlagen ($FAILED Route(n)). Server-Log:"
  tail -50 /tmp/smoke-server.log
  exit 1
fi

echo ""
echo "✓ Alle ${#ROUTES[@]} Routen grün."
