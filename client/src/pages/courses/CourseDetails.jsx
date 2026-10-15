/* Course detail screen loads one course by its route id and displays descriptive
 information, assigned-student count, and links to edit or student records.
 This file controls the page that displays detailed information 
 about one selected course in the Student Management System. */
import { useEffect, useState } from "react";
/* The useState allows React to remember information that can change, such
as the selected coursem whether data is loading, and whether 
an error occurred.
   The useEffect allows React to run code in response to certain 
changes or lifecycle events. In here, it is used to load the course,
when the page is opened or the course ID changes. */
import { Link, useParams } from "react-router-dom";
/* useParams reads values from the current URL when a route contains
named parameters. Therefore, useParams helps this page determine what
course to retrieve while Link allows users to related pages. */
import Loader from "../../components/Loader";
/* This is the loading component, when the course information is 
retrieved, the component displays a loading indicator instead of 
leaving the user with a blank screen. */
import ErrorState from "../../components/ErrorState";
/* This is the error state component, which displays an error 
message and a retry button when an error occurs. */
import { courseService } from "../../services/courseService";
/* This is the service for interacting with the course API endpoints. */
import { getErrorMessage } from "../../utils/errors";
/* This is a utility function for extracting error messages from API errors.
This imports a helper function that turns an error into a message 
suitable for display to the user. */
export default function CourseDetails() {
  // The router supplies `id`; local state holds this page's request result.
  const { id } = useParams();
  const [course, setCourse] = useState(null),
    [loading, setLoading] = useState(true),
    /* In this second state, this state records whether the component
    is waiting for the course request to finish. Why does it begin at
    true? When the component first opens, it has not yet received the
    course information. Showing a loading indicator is more 
    appropriate than displaying an empty course page. */
    [error, setError] = useState("");
  /* In this third state, this state records any error messages
     that occur while fetching the course information. 
     or this state stores an error message. */
  const load = async () => {
    /* In this function, it is responsible for retrieving the selected course. */
    // Reset status before each request so retries show a fresh loading state.
    setLoading(true);
    /* In here, it tells React that a course request is in progress. */
    setError("");
    /* In here, it clears any previous error messages. or it clears any error
    left over from a previous request. */
    try {
      setCourse(await courseService.getById(id));
    } catch (e) {
      setError(getErrorMessage(e, "Course not found."));
      /* In here, it sets the error message when the course is not found. 
      or it prepares a message that the error interface can show to the user. */
    } finally {
      /* In here, it tells React that the course request is complete. */
      setLoading(false);
    }
  };
  /* it connects the page to the backend and supplies the data 
   that appears in the course-details interface.  */
  useEffect(() => {
    /* In here, it tells React when to run the load function.  */
    // Reload when the user navigates from one course id to another.
    load();
  }, [id]);
  /* In here, the page loads the current course when first opened
  and can retrieve updated information when the ID changes. */
  if (loading) return <Loader label="Loading course..." />;
  /* In here, if (loading) asks whether the loading variable is true.
  If it is true, the component immediately returns the loader component.
  The label prop provides a description for the loader. or supplies
  the text for the loader. Therefore, the user sees a loading indicator
  while the course data is being fetched or retrieved. */
  if (error) return <ErrorState message={error} onRetry={load} />;
  /* In here, if (error) asks whether the error variable is true.
  If it is true, the component immediately returns the error state component.
  The message prop provides the error message to display. or the
  page can show an error message and provide a retry mechanism
  without duplicating the loading logic. */
  return (
    <div className="page-stack">
      <Link className="back-link" to="/courses">
        ← Back to courses
      </Link>
      <section className="course-detail panel">
        {/* In here it groups the course information into a styled panel. */}
        {/* The detail screen uses the server-enriched student count and creation date. */}
        <div className="course-code large">{course.code}</div>
        {/* In here, it displays the course name or the user can quickly identify
        the selected course by its code. */}
        <span className="kicker">Course details</span>
        {/* In here, it gives the user a small label indicating the type of page 
        they are viewing. */}
        <h2>{course.name}</h2>
        {/* In here, this is the main identifying title for the selected course. */}
        <p className="lead">{course.description}</p>
        {/* In here, the user can read the description of the selected course. */}
        <div className="detail-stats">
          <div>
            <strong>{course.studentCount}</strong>
            {/* course.studentCount reads the number of students assigned to the course.
            In here, users can see how many of their students are assigned to the course. */}
            <span>Assigned students</span>
          </div>
          <div>
            <strong>{new Date(course.createdAt).toLocaleDateString()}</strong>
            <span>Created</span>
          </div>
        </div>
        <div className="form-actions">
          <Link className="button button-secondary" to={`/courses/${id}/edit`}>
            Edit course
          </Link>
          <Link className="button button-primary" to="/students">
            View students
          </Link>
        </div>
      </section>
    </div>
  );
}
