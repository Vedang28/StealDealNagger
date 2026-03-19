import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import GetDemo from "./pages/GetDemo";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import DealDetail from "./pages/DealDetail";
import CreateDeal from "./pages/CreateDeal";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Rules from "./pages/Rules";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Integrations from "./pages/Integrations";
import Onboarding from "./pages/Onboarding";

function SidebarLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <Sidebar />
      {/* pb-20 md:pb-0 adds space for mobile bottom tab bar */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && !localStorage.getItem("sdn_onboarding_complete")) {
      setShowOnboarding(true);
    }
  }, [user]);

  function completeOnboarding() {
    localStorage.setItem("sdn_onboarding_complete", "true");
    setShowOnboarding(false);
  }

  return (
    <>
      {user && <CommandPalette />}
      {showOnboarding && (
        <Onboarding onComplete={completeOnboarding} onSkip={completeOnboarding} />
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Landing */}
          <Route
            path="/"
            element={
              user ? <Navigate to="/dashboard" replace /> : <LandingPage />
            }
          />

          {/* Public */}
          <Route path="/get-demo" element={<GetDemo />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <Register />}
          />

          {/* Protected — all use SidebarLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Dashboard />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/deals"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Deals />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/deals/new"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <CreateDeal />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/deals/:id"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <DealDetail />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Analytics />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Notifications />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rules"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Rules />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Settings />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Team />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <SidebarLayout>
                  <Integrations />
                </SidebarLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/"} replace />}
          />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </ThemeProvider>
  );
}
