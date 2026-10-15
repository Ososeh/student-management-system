// Student collection screen: load records, filter them as the user types, and
// offer view/edit/delete actions. The score helper is exported for unit tests.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import ConfirmModal from "../../components/ConfirmModal";
import { studentService } from "../../services/studentService";
import { getErrorMessage } from "../../utils/errors";
import { useAuth } from "../../context/AuthContext";

// CSS classes color a score by range; Number() also supports numeric strings.
export const getScoreIndicatorClass = (score) => {
  const value = Number(score);
  if (value < 40) return "score-indicator score-low";
  if (value < 80) return "score-indicator score-medium";
  return "score-indicator score-high";
};

export default function Students() {
  // Search is initialized from the current user's server-saved progress.
  const { progress, progressReady, saveProgress } = useAuth();
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState(() => progress.studentSearch || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    // Keep the list screen responsible for its own network status and data.
    setLoading(true);
    setError("");
    try {
      const loadedStudents = await studentService.getAll();
      setStudents(loadedStudents);
      console.log("Student data loaded successfully.");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Read the collection once after navigating to this page.
    load();
  }, []);

  useEffect(() => {
    // Wait until the server's initial progress has loaded, then save the
    // current search after a brief pause rather than sending every keystroke.
    if (!progressReady) return undefined;
    const timer = setTimeout(() => {
      saveProgress({ studentSearch: query }).catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [progressReady, query, saveProgress]);

  // Filtering is derived from source records, so changing the query does not
  // need a second list state that could become inconsistent.
  const filtered = students.filter((student) =>
    `${student.name} ${student.email} ${student.course?.name || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const remove = async () => {
    // Delete the selected record, update the visible collection, and close the
    // dialog only after the server reports success.
    setDeleting(true);
    try {
      await studentService.remove(deleteId);
      setStudents((current) =>
        current.filter((student) => student.id !== deleteId),
      );
      console.log("Student deleted successfully.");
      setDeleteId(null);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // Render clear request states before trying to display the student table.
  if (loading) return <Loader label="Loading students..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="page-stack">
      {/* Page heading provides a primary route into the create form. */}
      <section className="page-intro">
        <div>
          <span className="kicker">Records</span>
          <h2>Students</h2>
          <p>Search, review, and manage student records.</p>
        </div>
        <Link className="button button-primary" to="/students/new">
          + Add student
        </Link>
      </section>

      <section className="panel">
        {/* The controlled search input is both immediately usable and saved
            to the signed-in user's progress by the debounced effect above. */}
        <div className="toolbar">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search students"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or course"
            />
          </label>
          <span className="result-count">{filtered.length} results</span>
        </div>

        {/* Distinguish a truly empty account from a search with no matches. */}
        {filtered.length === 0 ? (
          <EmptyState
            title={query ? "No matches found" : "No students yet"}
            message={
              query
                ? "Try a different search term."
                : "Create your first student record to get started."
            }
            action={
              !query && (
                <Link className="button button-secondary" to="/students/new">
                  Add student
                </Link>
              )
            }
          />
        ) : (
          // A table shows each student's identity, course, status, score, and actions.
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  // Stable database ids let React track rows if filtering changes.
                  <tr key={student.id}>
                    <td>
                      <div className="table-person">
                        <span className="avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <Link to={`/students/${student.id}`}>
                            <strong>{student.name}</strong>
                          </Link>
                          <small>{student.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{student.course?.name || "Unassigned"}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          student.status === "Inactive" ? "inactive" : "active"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <span className="score-value">
                        <span
                          className={getScoreIndicatorClass(student.score)}
                          aria-hidden="true"
                        />
                        <span>{student.score}%</span>
                      </span>
                    </td>
                    <td>
                      <div className="action-links">
                        <Link
                          className="action-view"
                          to={`/students/${student.id}`}
                        >
                          View
                        </Link>
                        <Link
                          className="action-edit"
                          to={`/students/${student.id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          className="action-delete"
                          onClick={() => setDeleteId(student.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Only render confirmation while a selected student is pending deletion. */}
      {deleteId && (
        <ConfirmModal
          title="Delete student?"
          message="This will permanently remove the student record."
          onCancel={() => setDeleteId(null)}
          onConfirm={remove}
          busy={deleting}
        />
      )}
    </div>
  );
}
