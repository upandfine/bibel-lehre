# DNS-Setup für bib-inside.de

> Praktische Schritt-für-Schritt-Anleitung, um die Domain `bib-inside.de` für Bib-Inside einsatzbereit zu bekommen.
> Stand: 2026-05-05

## 1. Domain registrieren

Empfohlene deutsche Anbieter (alphabetisch):

- **INWX** (inwx.de) — bei Entwicklern beliebt, gute API, ca. 5 €/Jahr für `.de`
- **Hetzner** (hetzner.com/dns) — wenn du sowieso auf Hetzner-Infrastruktur denkst
- **IONOS** (ionos.de) — größter, aber Web-UI nicht jedermanns Sache
- **netcup** (netcup.de) — günstig, solide

Empfehlung: **INWX**. Saubere Web-UI, sauberer DNS-Editor, gute Reputation.

Bei der Registrierung:

- Whois-Schutz aktivieren (sonst stehen Privatadressen öffentlich).
- E-Mail-Forwarding optional aktivieren (z. B. `kontakt@bib-inside.de` → deine echte Adresse), bis ein eigener Mail-Server steht.

---

## 2. DNS-Einträge — Übersicht

Du brauchst Einträge für:

1. **Web** (App auf Sliplane)
2. **Versand-E-Mails** (Resend für Magic-Links etc.)
3. Optional: **Empfangs-E-Mails** (z. B. Mail-Forwarding bei INWX)

### 2.1 Web (Sliplane)

Sliplane gibt dir nach dem Service-Anlegen eine Hostname-Zuweisung in Form von:

- entweder einen `*.sliplane.app`-Hostnamen (z. B. `bib-inside-prod-xyz.sliplane.app`)
- oder direkt eine IP-Adresse

DNS-Einträge:

| Typ | Name | Wert | TTL |
|---|---|---|---|
| `CNAME` | `@` (oder `bib-inside.de`) | `bib-inside-prod-xyz.sliplane.app` | 3600 |
| `CNAME` | `www` | `bib-inside-prod-xyz.sliplane.app` | 3600 |

> Hinweis: Manche Registrare unterstützen `CNAME` auf Apex-Domain (`@`) nicht. Falls INWX das nicht erlaubt, alternative Lösung:
> - `ALIAS`/`ANAME`-Eintrag (falls verfügbar)
> - `A`-Record auf die IP, die Sliplane angibt (weniger flexibel, weil IPs sich ändern können)

In **Sliplane** musst du danach noch im Service unter „Custom Domain" `bib-inside.de` und `www.bib-inside.de` eintragen. Sliplane stellt dann automatisch ein Let's-Encrypt-TLS-Zertifikat bereit.

### 2.2 Versand-E-Mails (Resend)

Resend braucht drei Einträge, damit Mails von `bib-inside.de` nicht im Spam landen:

| Typ | Name | Wert | Zweck |
|---|---|---|---|
| `MX` | `send.bib-inside.de` | `feedback-smtp.eu-west-1.amazonses.com` (Priority 10) | Bounce-Rückläufer |
| `TXT` | `send.bib-inside.de` | `v=spf1 include:amazonses.com ~all` | SPF |
| `TXT` | `resend._domainkey.bib-inside.de` | (langer DKIM-Public-Key, kommt aus Resend-Dashboard) | DKIM |

Optional, aber empfohlen:

| Typ | Name | Wert | Zweck |
|---|---|---|---|
| `TXT` | `_dmarc.bib-inside.de` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@bib-inside.de;` | DMARC |

> Den DKIM-Eintrag generiert Resend, wenn du dort die Domain `bib-inside.de` hinzufügst. Achtung: in Resend EU-Region wählen (Frankfurt) — sonst fließen Mail-Header über die USA.

### 2.3 Empfangs-E-Mails (optional, MVP)

Solange noch kein eigener Mail-Server steht, reicht **Mail-Forwarding** beim Registrar:

- INWX: unter „E-Mail" → „Weiterleitung" einen Catch-All einrichten:
  - `*@bib-inside.de` → `sommer@upandfine.de`

Oder einzelne Adressen:

- `info@bib-inside.de` → `sommer@upandfine.de`
- `kontakt@bib-inside.de` → `sommer@upandfine.de`

> Wichtig: Wenn du sowohl **Resend** für Versand als auch **Forwarding** für Empfang nutzt, brauchst du:
> - `MX`-Records vom Forwarding-Anbieter (z. B. `mx.inwx.de`)
> - Resend nur über die **Subdomain** `send.bib-inside.de` versenden lassen — nicht über die Apex-Domain. So konfliktieren MX-Records nicht.

---

## 3. Reihenfolge der Schritte

1. Domain bei INWX registrieren (10 Minuten)
2. Whois-Schutz an
3. Optional: Mail-Forwarding einrichten (`*@bib-inside.de` → `sommer@upandfine.de`)
4. Resend-Account anlegen, EU-Region wählen
5. In Resend die Subdomain `send.bib-inside.de` als „Sending Domain" einrichten — Resend zeigt die nötigen DNS-Records an
6. Diese DNS-Records bei INWX setzen
7. Resend-Validierung abwarten (~5 Minuten)
8. Sliplane-Account anlegen, Service deployen, Custom Domain `bib-inside.de` + `www.bib-inside.de` zuweisen
9. CNAME-Records bei INWX setzen
10. Sliplane-Domain-Validierung abwarten — automatisch HTTPS

## 4. Verifikation

Nach allen Einträgen kurz testen:

```bash
# Mail-DNS prüfen
dig TXT send.bib-inside.de
dig TXT resend._domainkey.bib-inside.de
dig MX send.bib-inside.de

# Web-DNS prüfen
dig CNAME bib-inside.de
dig CNAME www.bib-inside.de

# Mail-Test
# Im Resend-Dashboard "Send test email" zu deiner sommer@upandfine.de
```

Wenn das alles antwortet wie erwartet → DNS steht, App ist erreichbar, Mails werden zugestellt.

---

## 5. Kosten-Schätzung (jährlich)

| Posten | Kosten |
|---|---|
| `.de`-Domain bei INWX | ~ 5 €/Jahr |
| Sliplane (1 Service + Postgres-Service) | ~ 10–15 €/Monat → 120–180 €/Jahr |
| Resend (Free Tier: 100 Mails/Tag, 3.000/Monat reicht für kleine Gemeinde) | 0 € |
| Backups (Hetzner Storage Box 100 GB) | ~ 4 €/Monat → 48 €/Jahr |
| **Summe** | **~ 175–235 €/Jahr** |

→ Liegt im Bereich, den eine Gemeinde aus dem normalen Budget tragen kann, ohne dass es eine Spendenkampagne braucht.
