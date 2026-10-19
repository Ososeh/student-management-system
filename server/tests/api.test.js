// Integration tests exercise Express through Supertest. Point the store at a
// unique temporary file so test setup can reset it without ever deleting real
// developer data from server/data/db.json.
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

process.env.SMS_DB_PATH = path.join(
  os.tmpdir(),
  `student-management-api-${process.pid}.json`,
);
const { default: app } = await import("../app.js");
const { dbPath } = await import("../utils/db.js");

const strongPassword = "Password123!";

// Register through the public endpoint, assert the expected response, and
// return the profile/token used by the rest of each integration scenario.
async function register(name, email) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password: strongPassword });
  expect(response.status).toBe(201);
  return response.body;
}

// Format the standard header required by middleware-protected API routes.
function authenticated(token) {
  return { Authorization: `Bearer ${token}` };
}

// Create a valid course through the API so tests use the same path as the UI.
async function createCourse(token, code = "CSE401") {
  return request(app)
    .post("/api/courses")
    .set(authenticated(token))
    .send({
      name: "Web Development",
      code,
      description: "Build and understand web applications.",
    });
}

describe("Student Management API", () => {
  beforeEach(async () => {
    // Guard against accidentally targeting the real database, then start each
    // scenario from a clean isolated file.
    expect(dbPath).toBe(
      path.resolve(os.tmpdir(), `student-management-api-${process.pid}.json`),
    );
    try {
      await fs.unlink(dbPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  });

  afterAll(async () => {
    // Remove the temporary database after all scenarios have finished.
    expect(dbPath).toBe(
      path.resolve(os.tmpdir(), `student-management-api-${process.pid}.json`),
    );
    try {
      await fs.unlink(dbPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  });

  it("serves a health response", async () => {
    // Health is public and confirms the Express app has mounted its status route.
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("registers a user with an empty private workspace and supports later login", async () => {
    // Start by verifying account creation returns safe profile data and a token.
    const created = await register("Test User", "test@example.com");
    expect(created.user).toMatchObject({
      name: "Test User",
      email: "test@example.com",
    });
    expect(created.user.passwordHash).toBeUndefined();
    expect(created.token).toEqual(expect.any(String));

    // Private student routes must reject requests that have no bearer token.
    const noToken = await request(app).get("/api/students");
    expect(noToken.status).toBe(401);
    const initialStudents = await request(app)
      .get("/api/students")
      .set(authenticated(created.token));
    const initialCourses = await request(app)
      .get("/api/courses")
      .set(authenticated(created.token));
    expect(initialStudents.body.students).toEqual([]);
    expect(initialCourses.body.courses).toEqual([]);

    const course = await createCourse(created.token);
    expect(course.status).toBe(201);
    const student = await request(app)
      .post("/api/students")
      .set(authenticated(created.token))
      .send({
        name: "Sam Lee",
        email: "sam@example.com",
        courseId: course.body.course.id,
        status: "Active",
        score: 88,
      });
    expect(student.status).toBe(201);

    const savedProgress = await request(app)
      .put("/api/progress")
      .set(authenticated(created.token))
      .send({
        lastPath: "/students",
        studentSearch: "Sam",
        studentFormDraft: {
          recordId: null,
          values: { name: "Unfinished draft" },
          ignoredField: "not stored",
        },
      });
    expect(savedProgress.status).toBe(200);
    expect(savedProgress.body.progress).toEqual({
      lastPath: "/students",
      studentSearch: "Sam",
      studentFormDraft: {
        recordId: null,
        values: { name: "Unfinished draft" },
      },
    });

    // A second login simulates returning after the browser was closed. The
    // database, not the old in-memory request state, supplies all saved values.
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "TEST@example.com", password: strongPassword });
    expect(login.status).toBe(200);
    const restoredProfile = await request(app)
      .get("/api/auth/me")
      .set(authenticated(login.body.token));
    const restoredStudents = await request(app)
      .get("/api/students")
      .set(authenticated(login.body.token));
    const restoredProgress = await request(app)
      .get("/api/progress")
      .set(authenticated(login.body.token));
    expect(restoredProfile.body.user).toMatchObject(created.user);
    expect(restoredStudents.body.students).toHaveLength(1);
    expect(restoredStudents.body.students[0].name).toBe("Sam Lee");
    expect(restoredProgress.body.progress).toEqual(savedProgress.body.progress);
  });

  it("persists student status transitions in both directions", async () => {
    const account = await register("Status User", "status@example.com");
    const course = await createCourse(account.token, "STATUS101");
    const created = await request(app)
      .post("/api/students")
      .set(authenticated(account.token))
      .send({
        name: "Status Student",
        email: "status-student@example.com",
        courseId: course.body.course.id,
        status: "Active",
        score: 80,
      });

    expect(created.status).toBe(201);
    const studentId = created.body.student.id;
    const inactive = await request(app)
      .put(`/api/students/${studentId}`)
      .set(authenticated(account.token))
      .send({
        name: "Status Student",
        email: "status-student@example.com",
        courseId: course.body.course.id,
        status: "Inactive",
        score: 80,
      });

    expect(inactive.status).toBe(200);
    expect(inactive.body.student.status).toBe("Inactive");
    const listed = await request(app)
      .get("/api/students")
      .set(authenticated(account.token));
    expect(listed.body.students[0].status).toBe("Inactive");

    const active = await request(app)
      .put(`/api/students/${studentId}`)
      .set(authenticated(account.token))
      .send({
        name: "Status Student",
        email: "status-student@example.com",
        courseId: course.body.course.id,
        status: "Active",
        score: 80,
      });

    expect(active.status).toBe(200);
    expect(active.body.student.status).toBe("Active");
  });

  it("isolates academic records and progress between accounts", async () => {
    // Create two independent identities and add private data to only the first.
    const first = await register("First User", "first@example.com");
    const second = await register("Second User", "second@example.com");
    const course = await createCourse(first.token, "FIRST101");
    const student = await request(app)
      .post("/api/students")
      .set(authenticated(first.token))
      .send({
        name: "Private Student",
        email: "private@example.com",
        courseId: course.body.course.id,
        status: "Active",
        score: 77,
      }, 30000);
    expect(student.status).toBe(201);

    const secondCourses = await request(app)
      .get("/api/courses")
      .set(authenticated(second.token));
    const secondStudents = await request(app)
      .get("/api/students")
      .set(authenticated(second.token));
    expect(secondCourses.body.courses).toEqual([]);
    expect(secondStudents.body.students).toEqual([]);

    const otherStudentId = student.body.student.id;
    const otherCourseId = course.body.course.id;
    expect(
      (await request(app)
        .get(`/api/students/${otherStudentId}`)
        .set(authenticated(second.token))).status,
    ).toBe(404);
    expect(
      (await request(app)
        .put(`/api/students/${otherStudentId}`)
        .set(authenticated(second.token))
        .send({})).status,
    ).toBe(404);
    expect(
      (await request(app)
        .delete(`/api/students/${otherStudentId}`)
        .set(authenticated(second.token))).status,
    ).toBe(404);
    expect(
      (await request(app)
        .get(`/api/courses/${otherCourseId}`)
        .set(authenticated(second.token))).status,
    ).toBe(404);
    expect(
      (await request(app)
        .delete(`/api/courses/${otherCourseId}`)
        .set(authenticated(second.token))).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post("/api/students")
          .set(authenticated(second.token))
          .send({
            name: "Cross-account attempt",
            email: "attempt@example.com",
            courseId: otherCourseId,
            status: "Active",
            score: 50,
          })
      ).status,
    ).toBe(400);

    await request(app)
      .put("/api/progress")
      .set(authenticated(first.token))
      .send({ lastPath: "/students" });
    await request(app)
      .put("/api/progress")
      .set(authenticated(second.token))
      .send({ lastPath: "/courses" });
    const firstProgress = await request(app)
      .get("/api/progress")
      .set(authenticated(first.token));
    const secondProgress = await request(app)
      .get("/api/progress")
      .set(authenticated(second.token));
    expect(firstProgress.body.progress.lastPath).toBe("/students");
    expect(secondProgress.body.progress.lastPath).toBe("/courses");
  });

  it("validates progress updates and course deletion constraints", async () => {
    // Invalid route paths are rejected before they can be saved as resume state.
    const account = await register("Course User", "course@example.com");
    expect(
      (
        await request(app)
          .put("/api/progress")
          .set(authenticated(account.token))
          .send({ lastPath: "//outside.example" })
      ).status,
    ).toBe(400);

    const course = await createCourse(account.token, "CSE302");
    const student = await request(app)
      .post("/api/students")
      .set(authenticated(account.token))
      .send({
        name: "Assigned Student",
        email: "assigned@example.com",
        courseId: course.body.course.id,
        status: "Active",
        score: 91,
      });
    expect(student.status).toBe(201);
    const blocked = await request(app)
      .delete(`/api/courses/${course.body.course.id}`)
      .set(authenticated(account.token));
    expect(blocked.status).toBe(409);

    const deleted = await request(app)
      .delete(`/api/students/${student.body.student.id}`)
      .set(authenticated(account.token));
    expect(deleted.status).toBe(204);
    expect(
      (
        await request(app)
          .delete(`/api/courses/${course.body.course.id}`)
          .set(authenticated(account.token))
      ).status,
    ).toBe(204);
  });
});
    // A new account must begin with its own empty course and student collections.
    // Create records and progress through APIs to exercise real persistence.
    // The second account sees neither list entries nor detail/update/delete access.
    // Workspace state is keyed by account id, so progress values do not overlap.
    // A course remains protected while a student references it, then can be
    // deleted once the student record is removed.
