"use client";

import { Music } from "lucide-react";

/**
 * Spielt das zum Vers hinterlegte Lied ab. Streamt vom geschützten
 * Endpoint (Range-fähig). `preload="none"`, damit beim Durchblättern
 * einer Session nicht ungefragt geladen wird.
 */
export function VerseAudio({ verseId }: { verseId: string }) {
  return (
    <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Music className="h-3.5 w-3.5" />
        Lied zum Vers
      </p>
      <audio
        controls
        preload="none"
        className="w-full"
        src={`/api/verse/${verseId}/audio`}
      >
        Dein Browser kann dieses Audio nicht abspielen.
      </audio>
    </div>
  );
}
