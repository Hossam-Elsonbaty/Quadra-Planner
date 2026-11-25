import { lazy, Suspense } from "react";
import { ConfigProvider, Spin } from "antd";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Planner = lazy(() => import("./pages/Planner.jsx"));
const Types = lazy(() => import("./pages/Types.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#647f6a",
          colorText: "#2b2b2b",
          colorTextSecondary: "#696860",
          colorBgBase: "#fffefa",
          colorBorder: "#dedbd2",
          borderRadius: 5,
          controlHeight: 40,
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          boxShadow: "none",
          boxShadowSecondary: "none",
        },
        components: {
          Card: { boxShadow: "none", boxShadowTertiary: "none" },
          Modal: { boxShadow: "none" },
          Button: { primaryShadow: "none" },
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" richColors={false} />
          <Suspense fallback={<div className="page-loading"><Spin size="large" /></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Planner />} />
                  <Route path="/types" element={<Types />} />
                  <Route element={<ProtectedRoute role="admin" />}>
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}
