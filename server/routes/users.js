import { Router } from "express";
import { z } from "zod";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";
import validate from "../middleware/validate.js";

const router = Router();
const idSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) });

router.use(auth, requireRole("admin"));

router.get("/", async (req, res, next) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .lean();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", validate(idSchema, "params"), async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id).select("id");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
