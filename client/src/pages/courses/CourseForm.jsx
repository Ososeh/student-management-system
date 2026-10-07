import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import FormField from "../../components/FormField";
import { courseService } from "../../services/courseService";
import { getErrorMessage } from "../../utils/errors";
import { validateCourse } from "../../utils/validation";
const initial = { name: "", code: "", description: "" };
export default function CourseForm() {
  const { id } = useParams(),
    editing = Boolean(id),
    navigate = useNavigate();
  const [values, setValues] = useState(initial),
    [errors, setErrors] = useState({}),
    [serverError, setServerError] = useState(""),
    [loading, setLoading] = useState(editing),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!editing) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const c = await courseService.getById(id);
        setValues({ name: c.name, code: c.code, description: c.description });
      } catch (e) {
        setServerError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, id]);
  const submit = async (e) => {
    e.preventDefault();
    const n = validateCourse(values);
    setErrors(n);
    if (Object.keys(n).length) return;
    setBusy(true);
    setServerError("");
    try {
      if (editing) await courseService.update(id, values);
      else await courseService.create(values);
      navigate("/courses");
    } catch (e) {
      setServerError(getErrorMessage(e, "Could not save the course."));
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
              onChange={(e) => setValues({ ...values, name: e.target.value })}
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
              onChange={(e) =>
                setValues({ ...values, code: e.target.value.toUpperCase() })
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
                onChange={(e) =>
                  setValues({ ...values, description: e.target.value })
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
