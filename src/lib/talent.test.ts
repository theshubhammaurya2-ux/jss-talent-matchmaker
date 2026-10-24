import { describe, expect, it } from "vitest";
import { candidateLevel, runTalentCheck } from "./talent";
import type { Skill } from "@/types";

const s = (category_code: Skill["category_code"], confidence: Skill["confidence"]): Skill => ({
  skill_name: "x", category_code, confidence, evidence: "",
});

describe("talent check", () => {
  it("scores high=3, medium=2, low=1", () => {
    expect(candidateLevel([s("DSA", "high"), s("DSA", "medium"), s("DSA", "low")], "DSA")).toBe(6);
  });
  it("caps level at 10", () => {
    expect(candidateLevel([s("COD", "high"), s("COD", "high"), s("COD", "high"), s("COD", "high")], "COD")).toBe(10);
  });
  it("uses minimum level 1 for empty category", () => {
    expect(candidateLevel([], "AI")).toBe(1);
  });
  it("flags gap and computes readiness", () => {
    const r = runTalentCheck([s("DSA", "high")], "X", { DSA: 6, SQL: 2 });
    expect(r.skillset_gap.find((g) => g.category_code === "DSA")?.gap).toBe(true);
    // min(3,6)+min(1,2) = 4 of 8
    expect(r.readiness_score).toBe(50);
  });
});
