import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import typeRoutes from "./routes/types.js";
import itemRoutes from "./routes/items.js";

dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_URL || false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts; try again later" },
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: "20kb" }));
app.use(mongoSanitize());
app.get("/", (req, res) => res.json({ message: "Weekly Planner API" }));
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/types", typeRoutes);
app.use("/api/items", itemRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: "Invalid request data" });
  }
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}

export default app;
