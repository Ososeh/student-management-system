// One course form handles both create and edit. The route id determines the
// operation, while the account's saved draft restores unfinished form values.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
import { courseService } from "../../services/courseService";
import { getErrorMessage } from "../../utils/errors";
import { validateCourse } from "../../utils/validation";

const initial = { name: "", code: "", description: "" };

export default function CourseForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { progress, saveProgress } = useAuth();
  // Keep the draft loaded for this visit separate from later autosave updates.
  const savedDraft = useRef(progress.courseFormDraft);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [draftReady, setDraftReady] = useState(!editing);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) {
      if (savedDraft.current?.recordId === null) {
        setValues({ ...initial, ...savedDraft.current.values });
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const course = await courseService.getById(id);
        if (cancelled) return;
        const serverValues = {
          name: course.name,
          code: course.code,
          description: course.description,
        };
        const draft = savedDraft.current;
        setValues(
          draft?.recordId === id
            ? { ...serverValues, ...draft.values }
            : serverValues,
        );
      } catch (error) {
        setServerError(getErrorMessage(error));
        if (savedDraft.current?.recordId === id) {
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
    // Debounce autosaves so typing is responsive and does not create a request
    // for every character. The server stores this draft under the account id.
    const timer = setTimeout(() => {
      saveProgress({
        courseFormDraft: { recordId: editing ? id : null, values },
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [draftReady, editing, id, saveProgress, values]);

  const submit = async (event) => {
    event.preventDefault();
    const validationErrors = validateCourse(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    setBusy(true);
    setServerError("");
    try {
      if (editing) await courseService.update(id, values);
      else await courseService.create(values);
      // The course itself is now durable; clear the redundant unfinished draft.
      try {
        await saveProgress({ courseFormDraft: null });
      } catch {
        // saveProgress displays persistence failures in the shared alert.
      }
      navigate("/courses");
    } catch (error) {
      setServerError(
        getErrorMessage(error, "Could not save the course."),
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading course..." />;

  return (
    <div className="form-page">
      <Link className="back-link" to="/courses">
        ← Back to courses
      </Link>
      <div className="page-intro">
        <div>
          <span className="kicker">{editing ? "Edit course" : "New course"}</span>
          <h2>{editing ? "Edit course" : "Create course"}</h2>
          <p>Keep course information clear and consistent.</p>
        </div>
      </div>
      {serverError && (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}
      <form className="panel form-panel" onSubmit={submit} noValidate>
        <div className="form-grid">
          <FormField
            label="Course name"
            name="name"
            error={errors.name}
            required
          >
            <input
              id="name"
              value={values.name}
              onChange={(event) =>
                setValues({ ...values, name: event.target.value })
              }
            />
          </FormField>
          <FormField
            label="Course code"
            name="code"
            error={errors.code}
            required
          >
            <input
              id="code"
              value={values.code}
              onChange={(event) =>
                setValues({ ...values, code: event.target.value.toUpperCase() })
              }
            />
          </FormField>
          <div className="field-full">
            <FormField
              label="Description"
              name="description"
              error={errors.description}
              required
            >
              <textarea
                id="description"
                rows="5"
                value={values.description}
                onChange={(event) =>
                  setValues({ ...values, description: event.target.value })
                }
              />
            </FormField>
          </div>
        </div>
        <div className="form-actions">
          <Link className="button button-secondary" to="/courses">
            Cancel
          </Link>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Saving..." : editing ? "Save changes" : "Create course"}
          </button>
        </div>
      </form>
    </div>
  );
}
