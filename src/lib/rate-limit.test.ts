import { afterEach, describe, expect, it } from "vitest";
import { consumeRateLimit } from "./rate-limit";

const opts = { max: 3, windowMs: 1000 };

describe("consumeRateLimit", () => {
  // Pro Test eindeutige Scope/Key, sodass die in-memory Map nicht zwischen
  // Tests leaked. Falls der Map-Cleanup dazwischen kommt, kein Problem.
  let counter = 0;
  const next = () => `t${counter++}`;

  afterEach(() => {
    // Garantiert frischer Bucket im nächsten Test.
  });

  it("erlaubt die ersten max-Anfragen, dann blockiert", () => {
    const scope = next();
    const key = "ip-1";
    const a = consumeRateLimit(scope, key, opts);
    const b = consumeRateLimit(scope, key, opts);
    const c = consumeRateLimit(scope, key, opts);
    const d = consumeRateLimit(scope, key, opts);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(true);
    expect(d.allowed).toBe(false);
    expect(d.remaining).toBe(0);
  });

  it("verschiedene Keys haben getrennte Buckets", () => {
    const scope = next();
    consumeRateLimit(scope, "ip-A", opts);
    consumeRateLimit(scope, "ip-A", opts);
    consumeRateLimit(scope, "ip-A", opts);
    const onB = consumeRateLimit(scope, "ip-B", opts);
    expect(onB.allowed).toBe(true);
    expect(onB.remaining).toBe(opts.max - 1);
  });

  it("verschiedene Scopes sind unabhängig", () => {
    const key = "ip-shared";
    consumeRateLimit("scope-X", key, opts);
    consumeRateLimit("scope-X", key, opts);
    consumeRateLimit("scope-X", key, opts);
    const onY = consumeRateLimit("scope-Y", key, opts);
    expect(onY.allowed).toBe(true);
  });
});
