import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import Loader from "../components/Loader";
import ErrorState from "../components/ErrorState";
import { studentService } from "../services/studentService";
import { courseService } from "../services/courseService";
import { getErrorMessage } from "../utils/errors";
import { useAuth } from "../context/AuthContext";
export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ students: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [students, courses] = await Promise.all([
        studentService.getAll(),
        courseService.getAll(),
      ]);
      setData({ students, courses });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  if (loading) return <Loader label="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  const active = data.students.filter((s) => s.status === "Active").length;
  const average = data.students.length
    ? Math.round(
        data.students.reduce((sum, s) => sum + Number(s.score || 0), 0) /
          data.students.length,
      )
    : 0;
  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <span className="kicker">Overview</span>
          <h2>Good to see you, {user?.name?.split(" ")[0]}.</h2>
          <p>Here is what is happening across your academic records.</p>
        </div>
        <Link className="button button-primary" to="/students/new">
          + Add student
        </Link>
      </section>
      <section className="stats-grid">
        <StatCard
          label="Total students"
          value={data.students.length}
          detail="Students in the system"
          icon="◉"
        />
        <StatCard
          label="Total courses"
          value={data.courses.length}
          detail="Available courses"
          icon="▣"
        />
        <StatCard
          label="Active students"
          value={active}
          detail="Currently active"
          icon="✓"
        />
        <StatCard
          label="Average score"
          value={`${average}%`}
          detail="Across all students"
          icon="★"
        />
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="kicker">Latest records</span>
              <h3>Recent students</h3>
            </div>
            <Link to="/students">View all</Link>
          </div>
          {data.students.slice(0, 5).map((s) => (
            <Link className="record-row" to={`/students/${s.id}`} key={s.id}>
              <span className="avatar">{s.name.charAt(0).toUpperCase()}</span>
              <span>
                <strong>{s.name}</strong>
                <small>{s.email}</small>
              </span>
              <span className="status-badge">{s.status}</span>
            </Link>
          ))}
        </div>
        <div className="panel quick-panel">
          <span className="kicker">Quick actions</span>
          <h3>Keep your records moving</h3>
          <p>
            Create, update, and review academic records without leaving the
            dashboard.
          </p>
          <Link
            className="button button-secondary button-full"
            to="/students/new"
          >
            Add a student
          </Link>
          <Link className="button button-ghost button-full" to="/courses/new">
            Create a course
          </Link>
        </div>
      </section>
    </div>
  );
}
