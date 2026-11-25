import { Navigate, Outlet } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
