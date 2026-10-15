/* Browser entry point: mount React into the HTML root, then make URL routing
and shared authentication state available to every page. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ProgressTracker from './components/ProgressTracker';
import { AuthProvider } from './context/AuthContext';
import './index.css';

/*  `root` is the empty mount point in index.html where React takes control of
 the page. The nested providers make routing and account state available
 everywhere below them; the tracker records protected route changes. */
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode helps reveal unsafe side effects during development.
  <React.StrictMode>
    {/* BrowserRouter selects pages from the current URL. */}
    <BrowserRouter>
      {/* AuthProvider shares sign-in state across all routes. */}
      <AuthProvider>
        <ProgressTracker />
        {/* App contains the route map, so the provider wraps every screen. */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
