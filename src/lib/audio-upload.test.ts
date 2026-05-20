import { describe, expect, it } from "vitest";
import { MAX_AUDIO_BYTES, validateAudioUpload } from "./audio-upload";

describe("validateAudioUpload", () => {
  it("akzeptiert MP3 per MIME und normalisiert", () => {
    const r = validateAudioUpload({
      mimeType: "audio/mpeg",
      filename: "lied.mp3",
      size: 1000,
    });
    expect(r).toEqual({ ok: true, mimeType: "audio/mpeg" });
  });

  it("akzeptiert WAV-Varianten und vereinheitlicht zu audio/wav", () => {
    for (const m of ["audio/wav", "audio/x-wav", "audio/wave"]) {
      const r = validateAudioUpload({
        mimeType: m,
        filename: "x.wav",
        size: 1000,
      });
      expect(r).toEqual({ ok: true, mimeType: "audio/wav" });
    }
  });

  it("nutzt Datei-Endung als Fallback bei leerem MIME", () => {
    expect(
      validateAudioUpload({ mimeType: "", filename: "song.WAV", size: 10 }),
    ).toEqual({ ok: true, mimeType: "audio/wav" });
    expect(
      validateAudioUpload({
        mimeType: undefined,
        filename: "song.mp3",
        size: 10,
      }),
    ).toEqual({ ok: true, mimeType: "audio/mpeg" });
  });

  it("lehnt fremde Typen ab", () => {
    const r = validateAudioUpload({
      mimeType: "application/pdf",
      filename: "doc.pdf",
      size: 10,
    });
    expect(r.ok).toBe(false);
  });

  it("lehnt zu große und leere Dateien ab", () => {
    expect(
      validateAudioUpload({
        mimeType: "audio/mpeg",
        filename: "big.mp3",
        size: MAX_AUDIO_BYTES + 1,
      }).ok,
    ).toBe(false);
    expect(
      validateAudioUpload({
        mimeType: "audio/mpeg",
        filename: "empty.mp3",
        size: 0,
      }).ok,
    ).toBe(false);
  });
});
