/**
 * E-Mail-Template für den Magic-Link-Versand.
 *
 * Tonalität bewusst warm und einladend — passend zum Designprinzip
 * „liebevolle Einschätzung & Ermutigung". Kein Marketing-Sprech.
 */

type MagicLinkProps = {
  url: string;
  email: string;
  appName?: string;
  validForMinutes?: number;
};

export function renderMagicLinkSubject(): string {
  return "Dein Anmelde-Link für Bib-Inside";
}

export function renderMagicLinkText({
  url,
  appName = "Bib-Inside",
  validForMinutes = 30,
}: MagicLinkProps): string {
  return `Hallo,

du wolltest dich bei ${appName} anmelden. Klicke auf den folgenden Link, um die Anmeldung abzuschließen:

${url}

Der Link ist ${validForMinutes} Minuten gültig.

Falls du diese E-Mail nicht erwartet hast, kannst du sie einfach ignorieren — es passiert nichts.

Gott segne dich,
Bib-Inside`;
}

export function renderMagicLinkHtml({
  url,
  appName = "Bib-Inside",
  validForMinutes = 30,
}: MagicLinkProps): string {
  // Inline-Styles, weil viele Mail-Clients <style>-Tags filtern.
  // Farben passen zum App-Design (warmer Cream + tiefes Blau).
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(renderMagicLinkSubject())}</title>
</head>
<body style="margin:0; padding:0; background-color:#faf8f4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#1a2233;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#faf8f4; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:520px; background-color:#ffffff; border-radius:12px; padding:40px 32px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td>
              <h1 style="margin:0 0 24px 0; font-size:24px; font-weight:700; color:#1a2233;">Hallo,</h1>
              <p style="margin:0 0 16px 0; font-size:16px; line-height:1.6;">
                du wolltest dich bei <strong>${escapeHtml(appName)}</strong> anmelden.
              </p>
              <p style="margin:0 0 32px 0; font-size:16px; line-height:1.6;">
                Klicke auf den folgenden Button, um die Anmeldung abzuschließen:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:0 0 32px 0;">
                    <a href="${escapeHtml(url)}"
                       style="display:inline-block; padding:14px 32px; background-color:#2c4d8c; color:#ffffff; text-decoration:none; border-radius:8px; font-size:16px; font-weight:600;">
                      Jetzt anmelden
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#5a6478;">
                Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
              </p>
              <p style="margin:0 0 24px 0; font-size:13px; line-height:1.5; color:#5a6478; word-break:break-all;">
                ${escapeHtml(url)}
              </p>
              <p style="margin:0 0 8px 0; font-size:14px; line-height:1.6; color:#5a6478;">
                Der Link ist <strong>${validForMinutes} Minuten</strong> gültig.
              </p>
              <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#5a6478;">
                Falls du diese E-Mail nicht erwartet hast, kannst du sie einfach ignorieren — es passiert nichts.
              </p>
              <hr style="border:0; border-top:1px solid #e6e2d8; margin:24px 0;">
              <p style="margin:0; font-size:13px; line-height:1.6; color:#8a92a3;">
                Gott segne dich,<br>
                ${escapeHtml(appName)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
