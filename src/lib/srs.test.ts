import { describe, expect, it } from "vitest";
import {
  initialState,
  previewIntervals,
  schedule,
  type SrsState,
} from "./srs";

const FIXED_NOW = new Date("2026-01-01T12:00:00Z");

function dayDiff(a: Date, b: Date): number {
  return Math.round(
    (a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000),
  );
}

describe("srs.initialState", () => {
  it("startet bei ease 250, interval 0, reps 0", () => {
    const s = initialState();
    expect(s.easeFactor).toBe(250);
    expect(s.intervalDays).toBe(0);
    expect(s.repetitions).toBe(0);
  });
});

describe("srs.schedule — Grade 'again'", () => {
  it("setzt Repetitionen auf 0 und Intervall auf 0 (heute nochmal)", () => {
    const prev: SrsState = { easeFactor: 250, intervalDays: 6, repetitions: 2 };
    const out = schedule(prev, "again", FIXED_NOW);
    expect(out.repetitions).toBe(0);
    expect(out.intervalDays).toBe(0);
    expect(dayDiff(out.dueAt, FIXED_NOW)).toBe(0);
    expect(out.lastGrade).toBe("again");
  });

  it("zieht den Ease um 0.20 ab, Minimum bleibt 1.30", () => {
    const out = schedule({ easeFactor: 140, intervalDays: 1, repetitions: 1 }, "again");
    expect(out.easeFactor).toBe(130);
  });
});

describe("srs.schedule — Grade 'good' aus initial state", () => {
  it("erste good-Bewertung: interval = 1 Tag, reps = 1, ease unverändert", () => {
    const out = schedule(initialState(), "good", FIXED_NOW);
    expect(out.repetitions).toBe(1);
    expect(out.intervalDays).toBe(1);
    expect(out.easeFactor).toBe(250);
    expect(dayDiff(out.dueAt, FIXED_NOW)).toBe(1);
  });

  it("zweite good-Bewertung: interval = 6", () => {
    const after1 = schedule(initialState(), "good");
    const after2 = schedule(after1, "good");
    expect(after2.repetitions).toBe(2);
    expect(after2.intervalDays).toBe(6);
  });

  it("dritte good-Bewertung: interval = 6 × ease (250/100) = 15", () => {
    const after2: SrsState = { easeFactor: 250, intervalDays: 6, repetitions: 2 };
    const out = schedule(after2, "good");
    expect(out.intervalDays).toBe(15);
    expect(out.repetitions).toBe(3);
  });
});

describe("srs.schedule — Grade 'easy'", () => {
  it("erste easy: interval = 4, ease +0.15", () => {
    const out = schedule(initialState(), "easy");
    expect(out.intervalDays).toBe(4);
    expect(out.easeFactor).toBe(265);
    expect(out.repetitions).toBe(1);
  });

  it("zweite easy: interval = 7", () => {
    const after1 = schedule(initialState(), "easy");
    const out = schedule(after1, "easy");
    expect(out.intervalDays).toBe(7);
  });
});

describe("srs.schedule — Grade 'hard'", () => {
  it("erste hard: ease -0.15, interval mindestens 1", () => {
    const out = schedule(initialState(), "hard");
    expect(out.easeFactor).toBe(235);
    expect(out.intervalDays).toBe(1);
    expect(out.repetitions).toBe(1);
  });

  it("hard mit bestehendem Intervall: interval × 1.2", () => {
    const prev: SrsState = { easeFactor: 250, intervalDays: 10, repetitions: 3 };
    const out = schedule(prev, "hard");
    expect(out.intervalDays).toBe(12); // round(10 * 1.2)
  });

  it("hard zieht ease nicht unter 1.30", () => {
    const prev: SrsState = { easeFactor: 140, intervalDays: 5, repetitions: 2 };
    const out = schedule(prev, "hard");
    expect(out.easeFactor).toBe(130);
  });
});

describe("srs.previewIntervals", () => {
  it("liefert für alle vier Stufen einen Tageswert", () => {
    const intervals = previewIntervals(initialState());
    expect(intervals.again).toBe(0);
    expect(intervals.good).toBe(1);
    expect(intervals.easy).toBe(4);
    expect(intervals.hard).toBeGreaterThanOrEqual(1);
  });
});
