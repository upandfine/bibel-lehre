/**
 * Lied-Audio pro Vers — Speicherung als bytea in Postgres.
 *
 *   POST   /api/verse/:id/audio   (Admin)  multipart, Feld "file"
 *   DELETE /api/verse/:id/audio   (Admin)
 *   GET    /api/verse/:id/audio   (sichtbar = eigen oder public), Range-fähig
 *
 * Bewusst Route-Handler statt Server-Action: Server-Actions haben ein
 * 1-MB-Body-Limit und können kein Range-Streaming fürs Vor-/Zurückspulen.
 */

import { NextResponse } from "next/server";
import {
  getAdminUserIdOrThrow,
  getOptionalUser,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/session";
import { validateAudioUpload } from "@/lib/audio-upload";
import {
  deleteVerseAudio,
  findVerseAccess,
  getVerseAudio,
  setVerseAudio,
} from "@/lib/repositories/verses";

function authErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let adminId: string;
  try {
    adminId = await getAdminUserIdOrThrow();
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json(
      { error: "Fehler" },
      { status: 500 },
    );
  }

  const access = await findVerseAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Vers nicht gefunden." }, { status: 404 });
  }
  if (access.ownerId !== adminId) {
    return NextResponse.json(
      { error: "Kein Zugriff auf diesen Vers." },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Upload (multipart erwartet)." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Feld 'file' fehlt." },
      { status: 400 },
    );
  }

  const check = validateAudioUpload({
    mimeType: file.type,
    filename: file.name,
    size: file.size,
  });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await setVerseAudio({
    verseId: id,
    data: buffer,
    mimeType: check.mimeType,
    filename: file.name ? file.name.slice(0, 255) : null,
    sizeBytes: buffer.byteLength,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let adminId: string;
  try {
    adminId = await getAdminUserIdOrThrow();
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json(
      { error: "Fehler" },
      { status: 500 },
    );
  }

  const access = await findVerseAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Vers nicht gefunden." }, { status: 404 });
  }
  if (access.ownerId !== adminId) {
    return NextResponse.json(
      { error: "Kein Zugriff auf diesen Vers." },
      { status: 403 },
    );
  }

  await deleteVerseAudio(id);
  return NextResponse.json({ success: true });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const user = await getOptionalUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const access = await findVerseAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Vers nicht gefunden." }, { status: 404 });
  }
  const visible =
    access.visibility === "public" || access.ownerId === user.id;
  if (!visible) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const audio = await getVerseAudio(id);
  if (!audio) {
    return NextResponse.json(
      { error: "Kein Lied hinterlegt." },
      { status: 404 },
    );
  }

  const total = audio.data.byteLength;
  const rangeHeader = request.headers.get("range");

  const baseHeaders: Record<string, string> = {
    "Content-Type": audio.mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  };

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (match) {
      const startStr = match[1];
      const endStr = match[2];
      let start = startStr === "" ? 0 : Number(startStr);
      let end = endStr === "" ? total - 1 : Number(endStr);

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start > end ||
        start >= total
      ) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${total}` },
        });
      }
      end = Math.min(end, total - 1);
      const chunk = new Uint8Array(audio.data.subarray(start, end + 1));
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Content-Length": String(chunk.byteLength),
        },
      });
    }
  }

  return new NextResponse(new Uint8Array(audio.data), {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(total) },
  });
}
