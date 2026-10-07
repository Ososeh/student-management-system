export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateStudent(v) {
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
  const e = {};
  if (!v.name.trim()) e.name = "Course name is required.";
  if (!v.code.trim()) e.code = "Course code is required.";
  if (!v.description.trim()) e.description = "Description is required.";
  return e;
}
export function validateRegistration(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!emailPattern.test(v.email.trim()))
    e.email = "Enter a valid email address.";
  if (v.password.length < 8)
    e.password = "Password must be at least 8 characters.";
  if (v.password !== v.confirmPassword)
    e.confirmPassword = "Passwords do not match.";
  return e;
}
