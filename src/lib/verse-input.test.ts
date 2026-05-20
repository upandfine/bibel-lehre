import { describe, expect, it } from "vitest";
import { VerseInputSchema, UpdateVerseSchema } from "./verse-input";

const base = {
  bookId: "43",
  chapter: "3",
  verseFrom: "16",
  verseTo: "16",
  translationId: "ELB-1905",
  text: "  Denn also hat Gott die Welt geliebt …  ",
};

describe("VerseInputSchema", () => {
  it("coerced String-Zahlen und trimmt Text, Default-Sichtbarkeit public", () => {
    const r = VerseInputSchema.parse(base);
    expect(r.bookId).toBe(43);
    expect(r.chapter).toBe(3);
    expect(r.text).toBe("Denn also hat Gott die Welt geliebt …");
    expect(r.visibility).toBe("public");
    expect(r.attributionOverride).toBeNull();
  });

  it("leere Attribution wird zu null, gefüllte bleibt erhalten", () => {
    expect(
      VerseInputSchema.parse({ ...base, attributionOverride: "   " })
        .attributionOverride,
    ).toBeNull();
    expect(
      VerseInputSchema.parse({ ...base, attributionOverride: " Quelle X " })
        .attributionOverride,
    ).toBe("Quelle X");
  });

  it("verseTo < verseFrom schlägt fehl", () => {
    const r = VerseInputSchema.safeParse({
      ...base,
      verseFrom: "16",
      verseTo: "12",
    });
    expect(r.success).toBe(false);
  });

  it("bookId außerhalb 1..66 schlägt fehl", () => {
    expect(VerseInputSchema.safeParse({ ...base, bookId: "0" }).success).toBe(
      false,
    );
    expect(VerseInputSchema.safeParse({ ...base, bookId: "67" }).success).toBe(
      false,
    );
  });

  it("leerer Text schlägt fehl", () => {
    expect(
      VerseInputSchema.safeParse({ ...base, text: "   " }).success,
    ).toBe(false);
  });

  it("UpdateVerseSchema verlangt UUID", () => {
    expect(
      UpdateVerseSchema.safeParse({ id: "nope", data: base }).success,
    ).toBe(false);
    expect(
      UpdateVerseSchema.safeParse({
        id: "11111111-1111-1111-1111-111111111111",
        data: base,
      }).success,
    ).toBe(true);
  });
});
