import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();
const credentialsSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});
const signupSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(100),
});

function createToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ sub: user.id }, secret, { expiresIn: "7d" });
}

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

router.post("/signup", validate(signupSchema), async (req, res, next) => {
  try {
    const firstUser = (await User.countDocuments()) === 0;
    const isAdminEmail =
      process.env.ADMIN_EMAIL?.trim().toLowerCase() === req.body.email;
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      passwordHash: await bcrypt.hash(req.body.password, 10),
      role: firstUser || isAdminEmail ? "admin" : "user",
    });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    next(error);
  }
});

router.post("/login", validate(credentialsSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", auth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
