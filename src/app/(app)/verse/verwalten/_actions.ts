"use server";

import { revalidatePath } from "next/cache";
import { validatedAction } from "@/lib/action-helpers";
import { getOptionalUser, UnauthorizedError } from "@/lib/session";
import {
  CreateVerseSchema,
  DeleteVerseSchema,
  UpdateVerseSchema,
} from "@/lib/verse-input";
import {
  createVerseItem,
  deleteVerseItem,
  updateVerseItem,
} from "@/lib/repositories/verses";
import type { VerseVisibility } from "@/lib/verse-input";

/**
 * Eigene Verse darf jeder eingeloggte Nutzer anlegen/bearbeiten. Nur Admins
 * dürfen jedoch über „privat“ hinaus veröffentlichen (group/public) — Lerner
 * legen ausschließlich private Verse an (siehe CLAUDE.md).
 */
async function currentUser() {
  const user = await getOptionalUser();
  if (!user?.id) throw new UnauthorizedError();
  return user;
}

function effectiveVisibility(
  isAdmin: boolean,
  requested: VerseVisibility,
): VerseVisibility {
  return isAdmin ? requested : "private";
}

export const createVerse = validatedAction(CreateVerseSchema, async (input) => {
  const user = await currentUser();
  const id = await createVerseItem(user.id, {
    ...input,
    visibility: effectiveVisibility(user.role === "admin", input.visibility),
  });
  revalidatePath("/verse/verwalten");
  revalidatePath("/verse");
  return { success: true, id } as const;
});

export const updateVerse = validatedAction(
  UpdateVerseSchema,
  async ({ id, data }) => {
    const user = await currentUser();
    const ok = await updateVerseItem(user.id, id, {
      ...data,
      visibility: effectiveVisibility(user.role === "admin", data.visibility),
    });
    if (!ok) throw new Error("Vers nicht gefunden oder keine Berechtigung.");
    revalidatePath("/verse/verwalten");
    revalidatePath("/verse");
    return { success: true } as const;
  },
);

export const deleteVerse = validatedAction(DeleteVerseSchema, async ({ id }) => {
  const user = await currentUser();
  const ok = await deleteVerseItem(user.id, id);
  if (!ok) throw new Error("Vers nicht gefunden oder keine Berechtigung.");
  revalidatePath("/verse/verwalten");
  revalidatePath("/verse");
  return { success: true } as const;
});
