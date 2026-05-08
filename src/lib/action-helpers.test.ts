import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ValidationError,
  flatValidationMessage,
  validatedAction,
} from "./action-helpers";

describe("validatedAction", () => {
  const schema = z.object({
    name: z.string().min(2),
    age: z.number().int().min(0),
  });

  it("ruft den Handler mit geparstem Input", async () => {
    let received: unknown;
    const wrapped = validatedAction(schema, async (input) => {
      received = input;
      return "ok";
    });
    const result = await wrapped({ name: "Eva", age: 30 });
    expect(result).toBe("ok");
    expect(received).toEqual({ name: "Eva", age: 30 });
  });

  it("wirft ValidationError bei Schema-Fehlschlag", async () => {
    const wrapped = validatedAction(schema, async () => "ok");
    await expect(wrapped({ name: "X", age: -1 })).rejects.toThrow(
      ValidationError,
    );
  });

  it("Handler-Errors fließen weiter durch", async () => {
    const wrapped = validatedAction(schema, async () => {
      throw new Error("Boom");
    });
    await expect(wrapped({ name: "Eva", age: 1 })).rejects.toThrow("Boom");
  });
});

describe("flatValidationMessage", () => {
  it("formatiert ValidationError lesbar", () => {
    const schema = z.object({ name: z.string().min(2) });
    try {
      schema.parse({ name: "X" });
    } catch (zodErr) {
      const msg = flatValidationMessage(
        new ValidationError(zodErr as z.ZodError),
      );
      expect(msg).toContain("name:");
    }
  });

  it("gibt null zurück bei anderen Fehlern", () => {
    expect(flatValidationMessage(new Error("x"))).toBeNull();
    expect(flatValidationMessage(null)).toBeNull();
  });
});
