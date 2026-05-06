import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health-Check für Sliplane / Docker HEALTHCHECK.
 * Antwortet einfach mit "ok" — keine DB-Abfrage, weil das Healthcheck-Polling sonst
 * unter Last selbst zur Last wird.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    name: "bib-inside",
    timestamp: new Date().toISOString(),
  });
}
