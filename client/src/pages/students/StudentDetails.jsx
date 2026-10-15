// Student profile page reads the :id from the URL, shows the related course,
// and confirms before permanently deleting the record.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import ConfirmModal from "../../components/ConfirmModal";
import { studentService } from "../../services/studentService";
import { getErrorMessage } from "../../utils/errors";

export default function StudentDetails() {
  // The URL id identifies which student the API should return.
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    // Reset the screen state before loading, including when retrying a failure.
    setLoading(true);
    setError("");
    try {
      setStudent(await studentService.getById(id));
    } catch (error) {
      setError(getErrorMessage(error, "Student not found."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // A changed URL id means this component must request a different student.
    load();
  }, [id]);

  const remove = async () => {
    // Keep the dialog busy during deletion so the same record is not submitted
    // twice; on success return to the collection page.
    setDeleting(true);
    try {
      await studentService.remove(id);
      console.log("Student deleted successfully.");
      navigate("/students");
    } catch (error) {
      console.error("Student deletion failed.");
      setError(getErrorMessage(error));
      setConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Loading and request errors replace the profile until there is valid data.
  if (loading) return <Loader label="Loading student..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page-stack">
      <Link className="back-link" to="/students">
        ← Back to students
      </Link>

      {/* Identity and actions form the profile header. */}
      <section className="profile-hero panel">
        <div className="profile-avatar">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="profile-copy">
          <span className="kicker">Student profile</span>
          <h2>{student.name}</h2>
          <p>{student.email}</p>
          <span
            className={`status-badge ${
              student.status === "Inactive" ? "inactive" : ""
            }`}
          >
            {student.status}
          </span>
        </div>
        <div className="profile-actions">
          <Link className="button button-secondary" to={`/students/${id}/edit`}>
            Edit
          </Link>
          <button className="button button-danger" onClick={() => setConfirm(true)}>
            Delete
          </button>
        </div>
      </section>

      {/* The description list pairs each field label with its displayed value. */}
      <section className="panel">
        <span className="kicker">Academic record</span>
        <h3>Student details</h3>
        <dl className="detail-list">
          <div>
            <dt>Course</dt>
            <dd>{student.course?.name || "Unassigned"}</dd>
          </div>
          <div>
            <dt>Course code</dt>
            <dd>{student.course?.code || "—"}</dd>
          </div>
          <div>
            <dt>Score</dt>
            <dd>{student.score}%</dd>
          </div>
          <div>
            <dt>Joined</dt>
            <dd>{new Date(student.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </section>

      {/* Ask for confirmation before an irreversible server-side deletion. */}
      {confirm && (
        <ConfirmModal
          title="Delete student?"
          message="This action cannot be undone."
          onCancel={() => setConfirm(false)}
          onConfirm={remove}
          busy={deleting}
        />
      )}
    </div>
  );
}
