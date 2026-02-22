import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [team, setTeam] = useState(() => {
    const stored = localStorage.getItem("team");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveAuth = (data) => {
    localStorage.setItem("accessToken", data.tokens.accessToken);
    localStorage.setItem("refreshToken", data.tokens.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("team", JSON.stringify(data.team));
    setUser(data.user);
    setTeam(data.team);
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      saveAuth(res.data.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.error?.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(data);
      saveAuth(res.data.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.error?.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("team");
    setUser(null);
    setTeam(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, team, loading, error, login, register, logout, setError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
