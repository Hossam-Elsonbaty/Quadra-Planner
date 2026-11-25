import { Button, Layout } from "antd";
import { CalendarDays, LogOut, Settings2, Shield } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const { Header, Content } = Layout;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <Layout className="app-shell">
      <Header className="topbar">
        <NavLink className="brand" to="/" aria-label="Weekly Planner home">
          <CalendarDays size={21} strokeWidth={1.8} />
          <span>Weekly Planner</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            Planner
          </NavLink>
          <NavLink to="/types">
            <Settings2 size={16} /> Types
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin">
              <Shield size={16} /> Admin
            </NavLink>
          )}
        </nav>
        <div className="account-menu">
          <span className="account-name">{user?.name}</span>
          <Button
            type="text"
            className="quiet-button"
            icon={<LogOut size={17} />}
            aria-label="Log out"
            onClick={handleLogout}
          />
        </div>
      </Header>
      <Content className="main-content">
        <Outlet />
      </Content>
    </Layout>
  );
}
