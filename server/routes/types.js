import { Router } from "express";
import { z } from "zod";
import Type from "../models/Type.js";
import Item from "../models/Item.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";

const router = Router();
const idSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) });
const typeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value"),
});
const updateTypeSchema = typeSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const types = await Type.find({ owner: req.user._id }).sort({ name: 1 }).lean();
    res.json({ types });
  } catch (error) {
    next(error);
  }
});

router.post("/", validate(typeSchema), async (req, res, next) => {
  try {
    const type = await Type.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ type });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A type with this name already exists" });
    }
    next(error);
  }
});

router.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateTypeSchema),
  async (req, res, next) => {
    try {
      const type = await Type.findOneAndUpdate(
        { _id: req.params.id, owner: req.user._id },
        { $set: req.body },
        { returnDocument: "after", runValidators: true }
      );
      if (!type) return res.status(404).json({ message: "Type not found" });
      res.json({ type });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "A type with this name already exists" });
      }
      next(error);
    }
  }
);

router.delete("/:id", validate(idSchema, "params"), async (req, res, next) => {
  try {
    const type = await Type.findOne({ _id: req.params.id, owner: req.user._id });
    if (!type) return res.status(404).json({ message: "Type not found" });
    if (await Item.exists({ type: type._id, owner: req.user._id })) {
      return res.status(409).json({ message: "Cannot delete a type that is used by items" });
    }
    await type.deleteOne();
    res.json({ message: "Type deleted" });
  } catch (error) {
    next(error);
  }
});

export default router;
