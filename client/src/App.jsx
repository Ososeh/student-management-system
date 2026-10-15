// Central route map. Lazy loading keeps pages out of the initial download until
// needed; Suspense displays Loader while a page's code is being fetched.
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AuthLayout from "./pages/AuthLayout";
import Loader from "./components/Loader";

// `lazy` loads each screen only when its route is visited. This keeps the
// initial JavaScript download smaller than importing every screen up front.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/students/Students"));
const StudentForm = lazy(() => import("./pages/students/StudentForm"));
const StudentDetails = lazy(() => import("./pages/students/StudentDetails"));
const Courses = lazy(() => import("./pages/courses/Courses"));
const CourseForm = lazy(() => import("./pages/courses/CourseForm"));
const CourseDetails = lazy(() => import("./pages/courses/CourseDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));
export default function App() {
  // The route tree maps browser paths to screens. The surrounding Suspense
  // boundary shows a loader while a lazy screen's JavaScript is downloaded.
  return (
    <Suspense fallback={<Loader fullScreen label="Loading page..." />}>
      <Routes>
        {/* Login and registration share the public authentication frame. */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        {/* This parent blocks all student/course pages until sign-in succeeds. */}
        <Route element={<ProtectedRoute />}>
          {/* The dashboard layout supplies navigation around these child pages. */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/new" element={<StudentForm />} />
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/students/:id/edit" element={<StudentForm />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/new" element={<CourseForm />} />
            <Route path="/courses/:id" element={<CourseDetails />} />
            <Route path="/courses/:id/edit" element={<CourseForm />} />
          </Route>
        </Route>
        {/* Send the site root to the default workspace screen. */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Catch every URL not matched above with a friendly not-found screen. */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
