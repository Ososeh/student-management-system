// Shared front-end validation rules. Centralizing them keeps form behavior
// consistent and makes the same rules easy to test without rendering a page.
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Each named rule is a function returning true when one password condition
// passes. Registration uses these same functions for both hints and validation.
export const passwordRequirements = {
  minLength: (password) => password.length >= 8,
  uppercase: (password) => /[A-Z]/.test(password),
  number: (password) => /[0-9]/.test(password),
  special: (password) => /[^A-Za-z0-9]/.test(password),
};
export const isStrongPassword = (password) =>
  // every() succeeds only when every individual password rule succeeds.
  Object.values(passwordRequirements).every((check) => check(password));
export function validateStudent(v) {
  // Return field-keyed messages so a form can show each error beside its input.
  const e = {};
  if (!v.name.trim()) e.name = "Student name is required.";
  if (!emailPattern.test(v.email.trim()))
    e.email = "Enter a valid email address.";
  if (!v.courseId) e.courseId = "Select a course.";
  if (!v.status) e.status = "Select a status.";
  if (v.score === "" || Number(v.score) < 0 || Number(v.score) > 100)
    e.score = "Score must be between 0 and 100.";
  return e;
}
export function validateCourse(v) {
  // Validate required course text before sending the form to the server.
  const e = {};
  if (!v.name.trim()) e.name = "Course name is required.";
  if (!v.code.trim()) e.code = "Course code is required.";
  if (!v.description.trim()) e.description = "Description is required.";
  return e;
}
export function validateRegistration(v) {
  // Registration checks both field formats and that confirmation matches.
  const e = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!emailPattern.test(v.email.trim()))
    e.email = "Enter a valid email address.";
  if (!isStrongPassword(v.password))
    e.password = "Password does not meet all requirements.";
  if (v.password !== v.confirmPassword)
    e.confirmPassword = "Passwords do not match.";
  return e;
}
