import { Button, Card, Typography } from "antd";
import { CalendarDays, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext.jsx";

const { Title, Text } = Typography;

export default function Signup() {
  const { signup, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(values) {
    try {
      await signup({ name: values.name, email: values.email, password: values.password });
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create your account.");
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card" variant="outlined">
        <div className="auth-mark"><CalendarDays size={25} /></div>
        <Title level={2}>Make room for your week</Title>
        <Text className="muted-copy">Create an account to start planning.</Text>
        <form className="stack-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            className="native-input"
            autoComplete="name"
            placeholder="Your name"
            {...register("name", { required: "Enter your name", maxLength: 100 })}
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register("password", {
                required: "Enter a password",
                minLength: { value: 8, message: "Use at least 8 characters" },
              })}
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
          <label htmlFor="confirmPassword">Confirm password</label>
          <div className="password-field">
            <input
              id="confirmPassword"
              className="native-input"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter your password again"
              {...register("confirmPassword", {
                required: "Confirm your password",
                validate: (value) => value === watch("password") || "Passwords do not match",
              })}
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword((visible) => !visible)}
            >
              {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}
          <Button type="primary" htmlType="submit" loading={isSubmitting} block>
            Create account
          </Button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </Card>
    </main>
  );
}
