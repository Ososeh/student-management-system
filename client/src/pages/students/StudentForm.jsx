// One form handles both create and edit. The optional route id selects edit
// mode, and a per-user server draft restores unfinished fields after a return.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { courseService } from "../../services/courseService";
import { studentService } from "../../services/studentService";
import { getErrorMessage } from "../../utils/errors";
import { validateStudent } from "../../utils/validation";

const initial = {
  name: "",
  email: "",
  courseId: "",
  status: "Active",
  score: 0,
};

export default function StudentForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { progress, saveProgress } = useAuth();
  // Capture the restored draft for this visit; later progress saves should not
  // restart the loading effect and overwrite what the user is currently typing.
  const savedDraft = useRef(progress.studentFormDraft);
  const [values, setValues] = useState(initial);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(true);
  const [draftReady, setDraftReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The course choices are required for the select menu. In edit mode, also
    // fetch the saved student before deciding whether a matching draft overlays it.
    let cancelled = false;
    (async () => {
      try {
        const availableCourses = await courseService.getAll();
        if (cancelled) return;
        setCourses(availableCourses);

        if (editing) {
          // A draft is applied only to the student id it was created for.
          const student = await studentService.getById(id);
          if (cancelled) return;
          const serverValues = {
            name: student.name,
            email: student.email,
            courseId: student.courseId,
            status: student.status,
            score: student.score,
          };
          const draft = savedDraft.current;
          setValues(
            draft?.recordId === id
              ? { ...serverValues, ...draft.values }
              : serverValues,
          );
        } else if (savedDraft.current?.recordId === null) {
          setValues({ ...initial, ...savedDraft.current.values });
        }
      } catch (error) {
        // Keep the form usable if saved data cannot be fetched but a matching
        // account draft is already available in the restored progress object.
        setServerError(getErrorMessage(error));
        if (editing && savedDraft.current?.recordId === id) {
          setValues({ ...initial, ...savedDraft.current.values });
        } else if (!editing && savedDraft.current?.recordId === null) {
          setValues({ ...initial, ...savedDraft.current.values });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDraftReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  useEffect(() => {
    if (!draftReady) return undefined;
    // A short debounce saves groups of keystrokes together while avoiding a
    // network request for every single character typed.
    const timer = setTimeout(() => {
      saveProgress({
        studentFormDraft: { recordId: editing ? id : null, values },
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [draftReady, editing, id, saveProgress, values]);

  const submit = async (event) => {
    // Native number inputs provide text; convert score to a number for the API.
    event.preventDefault();
    const validationErrors = validateStudent(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    setBusy(true);
    setServerError("");
    try {
      const studentValues = { ...values, score: Number(values.score) };
      if (editing) {
        await studentService.update(id, studentValues);
      } else {
        await studentService.create(studentValues);
      }
      // The saved record now contains these values, so remove only the draft;
      // the server-side student remains stored after logout or browser closure.
      try {
        await saveProgress({ studentFormDraft: null });
      } catch {
        // saveProgress exposes the failure in the shared workspace alert.
      }
      navigate("/students");
    } catch (error) {
      setServerError(
        getErrorMessage(error, "Could not save the student."),
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading student..." />;

  return (
    <div className="form-page">
      <Link className="back-link" to="/students">
        ← Back to students
      </Link>
      <div className="page-intro">
        <div>
          <span className="kicker">{editing ? "Edit record" : "New record"}</span>
          <h2>{editing ? "Edit student" : "Add student"}</h2>
          <p>
            {editing
              ? "Update the student information below."
              : "Add a student to the academic records."}
          </p>
        </div>
      </div>
      {/* role=alert makes server feedback available to assistive technology. */}
      {serverError && (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}
      <form className="panel form-panel" onSubmit={submit} noValidate>
        {/* Each FormField pairs an input with its label and validation error. */}
        <div className="form-grid">
          <FormField label="Full name" name="name" error={errors.name} required>
            <input
              id="name"
              value={values.name}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
            />
          </FormField>
          <FormField
            label="Email address"
            name="email"
            error={errors.email}
            required
          >
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={(event) =>
                setValues({ ...values, email: event.target.value })
              }
            />
          </FormField>
          <FormField label="Course" name="courseId" error={errors.courseId} required>
            <select
              id="courseId"
              value={values.courseId}
              onChange={(event) =>
                setValues({ ...values, courseId: event.target.value })
              }
            >
              {/* An empty option makes the user choose a valid course explicitly. */}
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status" name="status" error={errors.status} required>
            <select
              id="status"
              value={values.status}
              onChange={(event) =>
                setValues({ ...values, status: event.target.value })
              }
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </FormField>
          <FormField label="Score" name="score" error={errors.score} required>
            <input
              id="score"
              type="number"
              min="0"
              max="100"
              value={values.score}
              onChange={(event) =>
                setValues({ ...values, score: event.target.value })
              }
            />
          </FormField>
        </div>
        <div className="form-actions">
          <Link className="button button-secondary" to="/students">
            Cancel
          </Link>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Saving..." : editing ? "Save changes" : "Create student"}
          </button>
        </div>
      </form>
    </div>
  );
}
