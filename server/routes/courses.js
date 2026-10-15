// Course REST endpoints provide list/detail/create/update/delete behavior.
// Each course belongs to one account. Counts and delete checks use only that
// owner's students, preventing data in another account from affecting them.
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { readDb, updateDb } from "../utils/db.js";

const router = Router();

// Add a calculated count for display without storing a duplicate count that
// could become stale when students are moved or deleted.
function decorate(course, db) {
  return {
    ...course,
    studentCount: db.students.filter(
      (student) =>
        student.ownerId === course.ownerId && student.courseId === course.id,
    ).length,
  };
}

// Validate required course fields before any database change is made.
function validate(course) {
  const errors = [];
  if (!course.name?.trim()) errors.push("Course name is required.");
  if (!course.code?.trim()) errors.push("Course code is required.");
  if (!course.description?.trim()) errors.push("Description is required.");
  return errors;
}

router.get("/", async (req, res) => {
  // Only return rows owned by the identity added by requireAuth middleware.
  const db = await readDb();
  const courses = db.courses
    .filter((course) => course.ownerId === req.user.id)
    .map((course) => decorate(course, db));
  res.json({ courses });
});

router.get("/:id", async (req, res) => {
  // Check both id and owner; another account's id is indistinguishable from
  // an unknown id and therefore cannot be used to discover private records.
  const db = await readDb();
  const course = db.courses.find(
    (item) => item.id === req.params.id && item.ownerId === req.user.id,
  );
  if (!course) return res.status(404).json({ message: "Course not found." });
  res.json({ course: decorate(course, db) });
});

router.post("/", async (req, res) => {
  // Run validation, uniqueness checks, and insertion in one serialized update.
  const result = await updateDb((db) => {
    const errors = validate(req.body);
    if (errors.length) {
      return { status: 400, body: { message: errors.join(" "), errors } };
    }
    const code = req.body.code.trim().toUpperCase();
    const duplicate = db.courses.some(
      (course) => course.ownerId === req.user.id && course.code === code,
    );
    if (duplicate) {
      return {
        status: 409,
        body: { message: "A course with this code already exists." },
      };
    }
    const course = {
      // The authenticated user id, not a client-supplied body field, owns this row.
      id: randomUUID(),
      ownerId: req.user.id,
      name: req.body.name.trim(),
      code,
      description: req.body.description.trim(),
      createdAt: new Date().toISOString(),
    };
    db.courses.push(course);
    return { status: 201, body: { course: decorate(course, db) } };
  });
  res.status(result.status).json(result.body);
});

router.put("/:id", async (req, res) => {
  // Locate and update only a course owned by the caller.
  const result = await updateDb((db) => {
    const index = db.courses.findIndex(
      (course) => course.id === req.params.id && course.ownerId === req.user.id,
    );
    if (index < 0) {
      return { status: 404, body: { message: "Course not found." } };
    }
    const errors = validate(req.body);
    if (errors.length) {
      return { status: 400, body: { message: errors.join(" "), errors } };
    }
    const code = req.body.code.trim().toUpperCase();
    const duplicate = db.courses.some(
      (course) =>
        course.ownerId === req.user.id &&
        course.code === code &&
        course.id !== req.params.id,
    );
    if (duplicate) {
      return {
        status: 409,
        body: { message: "A course with this code already exists." },
      };
    }
    db.courses[index] = {
      ...db.courses[index],
      name: req.body.name.trim(),
      code,
      description: req.body.description.trim(),
    };
    return {
      status: 200,
      body: { course: decorate(db.courses[index], db) },
    };
  });
  res.status(result.status).json(result.body);
});

router.delete("/:id", async (req, res) => {
  // Preserve the relationship: a course cannot be removed while this user's
  // students still refer to it.
  const result = await updateDb((db) => {
    const index = db.courses.findIndex(
      (course) => course.id === req.params.id && course.ownerId === req.user.id,
    );
    if (index < 0) {
      return { status: 404, body: { message: "Course not found." } };
    }
    const hasStudents = db.students.some(
      (student) =>
        student.ownerId === req.user.id &&
        student.courseId === req.params.id,
    );
    if (hasStudents) {
      return {
        status: 409,
        body: {
          message:
            "This course has assigned students. Reassign them before deleting the course.",
        },
      };
    }
    db.courses.splice(index, 1);
    return { status: 204 };
  });
  if (result.status === 204) return res.status(204).send();
  return res.status(result.status).json(result.body);
});

export default router;
