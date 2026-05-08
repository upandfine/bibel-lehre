/**
 * Dünner Logging-Wrapper. Aktuell hinter console.* — der Vorteil ist die
 * konsistente Schnittstelle: wenn wir später auf Pino, Sliplane-JSON-Logs
 * oder einen externen Service wechseln, müssen wir nur diese Datei
 * anfassen, nicht alle Aufrufstellen.
 *
 * Nutzung:
 *
 *   log.info("auth.signIn", { email });
 *   log.warn("resend.fail", { error: err.message });
 *   log.error("srs.upsert", { userId, verseId, err });
 *
 * Konvention:
 *   - Erster Parameter: kurzer "namespace.event"-Slug, kebab-case
 *   - Zweiter Parameter: Kontext-Objekt mit Werten, KEINE PII außer
 *     Email/UserId wenn nötig
 */

type Ctx = Record<string, unknown> | undefined;

function format(level: string, event: string, ctx: Ctx): string {
  const payload = ctx ? ` ${JSON.stringify(ctx)}` : "";
  return `[${level}] ${event}${payload}`;
}

export const log = {
  debug(event: string, ctx?: Ctx) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug(format("debug", event, ctx));
    }
  },
  info(event: string, ctx?: Ctx) {
    // eslint-disable-next-line no-console
    console.log(format("info", event, ctx));
  },
  warn(event: string, ctx?: Ctx) {
    // eslint-disable-next-line no-console
    console.warn(format("warn", event, ctx));
  },
  error(event: string, ctx?: Ctx) {
    // eslint-disable-next-line no-console
    console.error(format("error", event, ctx));
  },
};
