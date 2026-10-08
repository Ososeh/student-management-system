// Student REST endpoints: list/search, fetch one, validate and create/update,
// and delete. Every read and write is restricted to req.user.id so another
// account cannot discover or change this user's student records.
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { readDb, updateDb } from "../utils/db.js";

const router = Router();

function decorate(student, db) {
  const course = db.courses.find(
    (item) =>
      item.id === student.courseId && item.ownerId === student.ownerId,
  );
  return { ...student, course: course || null };
}

function validate(student, db, ownerId) {
  const errors = [];
  if (!student.name?.trim()) errors.push("Name is required.");
  if (!/^\S+@\S+\.\S+$/.test(student.email || "")) {
    errors.push("A valid email is required.");
  }
  if (
    !student.courseId ||
    !db.courses.some(
      (course) =>
        course.id === student.courseId && course.ownerId === ownerId,
    )
  ) {
    errors.push("Select a course in your workspace.");
  }
  if (!["Active", "Inactive"].includes(student.status)) {
    errors.push("Status must be Active or Inactive.");
  }
  if (
    student.score === "" ||
    student.score === null ||
    Number.isNaN(Number(student.score)) ||
    Number(student.score) < 0 ||
    Number(student.score) > 100
  ) {
    errors.push("Score must be between 0 and 100.");
  }
  return errors;
}

router.get("/", async (req, res) => {
  const db = await readDb();
  const query = (req.query.search || "").toLowerCase();
  let students = db.students
    .filter((student) => student.ownerId === req.user.id)
    .map((student) => decorate(student, db));
  if (query) {
    students = students.filter((student) =>
      `${student.name} ${student.email} ${student.course?.name || ""}`
        .toLowerCase()
        .includes(query),
    );
  }
  res.json({ students });
});

router.get("/:id", async (req, res) => {
  const db = await readDb();
  const student = db.students.find(
    (item) => item.id === req.params.id && item.ownerId === req.user.id,
  );
  if (!student) return res.status(404).json({ message: "Student not found." });
  res.json({ student: decorate(student, db) });
});

router.post("/", async (req, res) => {
  const result = await updateDb((db) => {
    const errors = validate(req.body, db, req.user.id);
    if (errors.length) {
      return { status: 400, body: { message: errors.join(" "), errors } };
    }
    const student = {
      id: randomUUID(),
      ownerId: req.user.id,
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      courseId: req.body.courseId,
      status: req.body.status,
      score: Number(req.body.score),
      createdAt: new Date().toISOString(),
    };
    db.students.push(student);
    return { status: 201, body: { student: decorate(student, db) } };
  });
  res.status(result.status).json(result.body);
});

router.put("/:id", async (req, res) => {
  const result = await updateDb((db) => {
    const index = db.students.findIndex(
      (item) => item.id === req.params.id && item.ownerId === req.user.id,
    );
    if (index < 0) {
      return { status: 404, body: { message: "Student not found." } };
    }
    const errors = validate(req.body, db, req.user.id);
    if (errors.length) {
      return { status: 400, body: { message: errors.join(" "), errors } };
    }
    db.students[index] = {
      ...db.students[index],
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      courseId: req.body.courseId,
      status: req.body.status,
      score: Number(req.body.score),
    };
    return {
      status: 200,
      body: { student: decorate(db.students[index], db) },
    };
  });
  res.status(result.status).json(result.body);
});

router.delete("/:id", async (req, res) => {
  const result = await updateDb((db) => {
    const index = db.students.findIndex(
      (item) => item.id === req.params.id && item.ownerId === req.user.id,
    );
    if (index < 0) {
      return { status: 404, body: { message: "Student not found." } };
    }
    db.students.splice(index, 1);
    return { status: 204 };
  });
  if (result.status === 204) return res.status(204).send();
  return res.status(result.status).json(result.body);
});

export default router;
