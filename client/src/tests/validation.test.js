// Unit tests for reusable validation helpers and score-color boundaries. These
// checks protect key form rules without needing to render the whole interface.
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
  it("rejects registration passwords that miss each required rule", () => {
    const cases = [
      "Ab1!xyz",
      "ab1!xyza",
      "Ab!xyzaa",
      "Abcdefg1",
    ];

    cases.forEach((password) => {
      const errors = validateRegistration({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password,
        confirmPassword: password,
      });
      expect(errors.password).toBeTruthy();
    });
  });

  it("accepts a registration password that meets all requirements", () => {
    expect(
      validateRegistration({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "Password1!",
        confirmPassword: "Password1!",
      }),
    ).toEqual({});
  });
});
