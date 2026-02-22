import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import DealDetail from "./pages/DealDetail";
import CreateDeal from "./pages/CreateDeal";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-bg-light">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/deals"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Deals />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/deals/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateDeal />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/deals/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <DealDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}
