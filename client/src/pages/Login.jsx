import { Button, Card, Typography } from "antd";
import { CalendarDays, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext.jsx";

const { Title, Text } = Typography;

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(values) {
    try {
      await login(values);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to log in. Please try again.");
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card" variant="outlined">
        <div className="auth-mark"><CalendarDays size={25} /></div>
        <Title level={2}>Welcome back</Title>
        <Text className="muted-copy">Sign in to see what your week holds.</Text>
        <form className="stack-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="native-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email", {
              required: "Enter your email",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
            })}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input
              id="password"
              className="native-input"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              {...register("password", { required: "Enter your password" })}
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && <span className="field-error">{errors.password.message}</span>}
          <Button type="primary" htmlType="submit" loading={isSubmitting} block>
            Log in
          </Button>
        </form>
        <p className="auth-switch">New here? <Link to="/signup">Create an account</Link></p>
      </Card>
    </main>
  );
}
