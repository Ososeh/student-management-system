import { describe, expect, it } from "vitest";
import { validateStudent, validateRegistration } from "../utils/validation";
import { getScoreIndicatorClass } from "../pages/students/Students";
describe("validation helpers", () => {
  it("maps score ranges to the correct indicator class", () => {
    expect(getScoreIndicatorClass(0)).toBe("score-indicator score-low");
    expect(getScoreIndicatorClass(39)).toBe("score-indicator score-low");
    expect(getScoreIndicatorClass(40)).toBe("score-indicator score-medium");
    expect(getScoreIndicatorClass(79)).toBe("score-indicator score-medium");
    expect(getScoreIndicatorClass(80)).toBe("score-indicator score-high");
    expect(getScoreIndicatorClass(100)).toBe("score-indicator score-high");
  });
  it("rejects an incomplete student form", () => {
    const e = validateStudent({
      name: "",
      email: "bad",
      courseId: "",
      status: "",
      score: 120,
    });
    expect(e.name).toBeTruthy();
    expect(e.email).toBeTruthy();
    expect(e.courseId).toBeTruthy();
    expect(e.score).toBeTruthy();
  });
  it("accepts valid registration", () => {
    expect(
      validateRegistration({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "password123",
        confirmPassword: "password123",
      }),
    ).toEqual({});
  });
});
