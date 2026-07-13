import { checkBusinessHours } from "../businessHoursLogic";

describe("checkBusinessHours", () => {
  it("allows a call exactly at the start of business hours", () => {
    const nineThirtyAM = new Date(2026, 0, 1, 9, 30);
    const result = checkBusinessHours("09:30", "18:00", nineThirtyAM);
    expect(result.allowed).toBe(true);
  });

  it("allows a call in the middle of business hours", () => {
    const noon = new Date(2026, 0, 1, 12, 0);
    const result = checkBusinessHours("09:30", "18:00", noon);
    expect(result.allowed).toBe(true);
  });

  it("blocks a call one minute before business hours start", () => {
    const nineTwentyNine = new Date(2026, 0, 1, 9, 29);
    const result = checkBusinessHours("09:30", "18:00", nineTwentyNine);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Outside business hours");
  });

  it("blocks a call exactly at the end of business hours (end is exclusive)", () => {
    const sixPM = new Date(2026, 0, 1, 18, 0);
    const result = checkBusinessHours("09:30", "18:00", sixPM);
    expect(result.allowed).toBe(false);
  });

  it("blocks a call late at night", () => {
    const elevenPM = new Date(2026, 0, 1, 23, 0);
    const result = checkBusinessHours("09:30", "18:00", elevenPM);
    expect(result.allowed).toBe(false);
  });

  it("blocks a call in the early morning", () => {
    const fiveAM = new Date(2026, 0, 1, 5, 0);
    const result = checkBusinessHours("09:30", "18:00", fiveAM);
    expect(result.allowed).toBe(false);
  });

  it("respects custom business hours, not just the default 9:30–18:00", () => {
    const eightAM = new Date(2026, 0, 1, 8, 0);
    const result = checkBusinessHours("07:00", "20:00", eightAM);
    expect(result.allowed).toBe(true);
  });
});