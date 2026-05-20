/**
 * Reine Validierung für hochgeladene Lied-Dateien (MP3/WAV) — keine DB,
 * keine Next-Abhängigkeit, damit als Vitest-Unit testbar.
 *
 * Audio wird als bytea in Postgres abgelegt (Solo-Stack, kein Object-
 * Storage). Darum striktes Größenlimit, sonst wächst die DB unkontrolliert.
 */

export const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // 8 MB

/** Erlaubte MIME-Typen → kanonischer Typ, der in der DB gespeichert wird. */
const MIME_CANONICAL: Record<string, string> = {
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mpeg",
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/vnd.wave": "audio/wav",
};

const EXT_FALLBACK: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

export type AudioValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; error: string };

/**
 * Prüft MIME (mit Datei-Endungs-Fallback, weil Browser bei WAV gern
 * leeren oder uneinheitlichen Typ schicken) und Größe.
 */
export function validateAudioUpload(input: {
  mimeType: string | null | undefined;
  filename: string | null | undefined;
  size: number;
}): AudioValidationResult {
  if (input.size <= 0) {
    return { ok: false, error: "Datei ist leer." };
  }
  if (input.size > MAX_AUDIO_BYTES) {
    const mb = (MAX_AUDIO_BYTES / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      error: `Datei zu groß (max. ${mb} MB).`,
    };
  }

  const rawMime = (input.mimeType ?? "").toLowerCase().split(";")[0].trim();
  const canonical = MIME_CANONICAL[rawMime];
  if (canonical) {
    return { ok: true, mimeType: canonical };
  }

  const ext = (input.filename ?? "").toLowerCase().split(".").pop() ?? "";
  const fromExt = EXT_FALLBACK[ext];
  if (fromExt) {
    return { ok: true, mimeType: fromExt };
  }

  return {
    ok: false,
    error: "Nur MP3- oder WAV-Dateien sind erlaubt.",
  };
}
