// One course form handles both create and edit. The route id determines the
// operation, while the account's saved draft restores unfinished form values.
/* This component is responsible for the form used to create a new 
course or edit an existing course in the Student Management System. */
import { useEffect, useRef, useState } from "react";
/* In here, the useEffect performs work in response to changes, 
the component uses it to load an existing course and automatically
save draft information. The useRef holds a value without triggering
a re-render when it changes, the component uses it to keep the draft
that was available when the current visit began, separate from 
subsequent draft updates. */
import { Link, useNavigate, useParams } from "react-router-dom";
/* In here, Link creates a clickable link that takes the user to
another route. useNavigate gives the component a function for 
navigating to a different route from JavaScript. useParams reads
parameters from the current URL.*/
import Loader from "../../components/Loader";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";
/* In here, it provides access to:
(i.) progress: saved progress information associated with the
current account.
(ii.) saveProgress: a function to save progress information or
to save changes to that information. */
import { courseService } from "../../services/courseService";
import { getErrorMessage } from "../../utils/errors";
import { validateCourse } from "../../utils/validation";
/* In here, this imports the function that checks the course
form's values before submission. It is used to identify problems
with the course name, code, or description. */

const initial = { name: "", code: "", description: "" };
/* In here, this establishes a consistent structure for course
information throughout the form. Every field has a known property, 
even before the users enter anything. */

export default function CourseForm() {
  // Presence of a route id selects edit mode; without one this creates a course.
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { progress, saveProgress } = useAuth();
  /* In here, these five lines connect the form to the current 
  route, navigation system, and account-level persistence mechanism. */
  // Keep the draft loaded for this visit separate from later autosave updates.
  const savedDraft = useRef(progress.courseFormDraft);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [draftReady, setDraftReady] = useState(!editing);
  /* In here, this prevents the autosave effect from immediately 
  saving an incomplete or not-yet-restored form. */
  const [busy, setBusy] = useState(false);
  /* In here, this tracks whether the form is currently submitting.
  or this state records whether a submission is in progress. */

  /* The component now has separate mechanisms for remembering the
  current form data, validation messages, general errors, loading
  status, draft readiness, and submission status. Keeping these
  responsibilities separates makes the form easier to manage and debug. */

  useEffect(() => {
    // New-course forms restore a matching draft immediately. Edit forms first
    // load the server record, then overlay any draft for that same record id.
    if (!editing) {
      if (savedDraft.current?.recordId === null) {
        setValues({ ...initial, ...savedDraft.current.values });
      }
      return;
      /* In here, this ends the current execution of the effect's 
      function because the component is creating a new course, it
      does not need to fetch an course from the server. The
      return prevents the code below it from running in its path. */
    }

    let cancelled = false;
    /* The variable is used to prevent the asychronous loading 
    operation from updating component state after the effect has been 
    cleaned up. */
    /* In here, this initializes the form with the server's course data if in edit mode. */
    (async () => {
      try {
        const course = await courseService.getById(id);
        /* In here, the id identifies which course to retrieve.
        If succesful, the returned course information is assigned to course*/
        if (cancelled) return;
        /* In here, after the request finishes, the component checks
        whether th effect has been cancelled. If cancelled is true,
        return stops the function immediately. This prevents the component
        from continuing to process a response after the effect has been cleaned up. */
        const serverValues = {
          /* In here, this creates a new object with the course's name, code,
           and description. This object is used to update the form's values. */
          name: course.name,
          code: course.code,
          description: course.description,
        };
        const draft = savedDraft.current;
        /* In here, this assigns the saved draft reference to a local variable named draft. */
        setValues(
          draft?.recordId === id
            ? { ...serverValues, ...draft.values }
            : serverValues,
        );
      } catch (error) {
        // Keep a matching draft usable even if its source record cannot load.
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
    // Validate locally for quick feedback; the server repeats validation as
    // the trusted boundary before it writes persistent data.
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
      setServerError(getErrorMessage(error, "Could not save the course."));
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
          <span className="kicker">
            {editing ? "Edit course" : "New course"}
          </span>
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
        {/* Reusable FormField components connect labels/errors to native inputs. */}
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
