import { Router } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import Type from "../models/Type.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { isOccurrenceOnDate, parseDateOnly } from "../utils/dates.js";

const router = Router();
const idSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) });
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (value) => parseDateOnly(value) !== null,
  "Date must be a valid YYYY-MM-DD date"
);
const occurrenceParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  date: dateSchema,
});
const itemFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: z.string().regex(/^[a-f\d]{24}$/i),
  date: dateSchema,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  notes: z.string().trim().max(5000).optional(),
  repeat: z.enum(["none", "weekly", "monthly", "yearly"]),
  endDate: dateSchema.optional(),
});
const itemSchema = itemFieldsSchema.superRefine((item, context) => {
  if (item.endTime && item.endTime <= item.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
  if (item.endDate && item.endDate < item.date) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date cannot be before start date",
    });
  }
});
const updateItemSchema = itemFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);
const occurrenceItemSchema = itemFieldsSchema.pick({
  title: true,
  type: true,
  date: true,
  startTime: true,
  endTime: true,
  notes: true,
}).superRefine((item, context) => {
  if (item.endTime && item.endTime <= item.startTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "End time must be after start time",
    });
  }
});
const querySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: "from must be on or before to",
});
const doneSchema = z.object({ date: dateSchema });

function dateFields(item) {
  return {
    ...item,
    date: parseDateOnly(item.date),
    ...(item.endDate ? { endDate: parseDateOnly(item.endDate) } : {}),
  };
}

async function validateOwnedType(typeId, ownerId) {
  return Type.exists({ _id: new mongoose.Types.ObjectId(typeId), owner: ownerId });
}

router.use(auth);

router.get("/", validate(querySchema, "query"), async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };
    const { from, to } = req.query;
    if (from && to) {
      filter.$or = [
        { repeat: "none", date: { $gte: parseDateOnly(from), $lte: parseDateOnly(to) } },
        {
          repeat: { $ne: "none" },
          date: { $lte: parseDateOnly(to) },
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: parseDateOnly(from) } },
          ],
        },
        {
          exceptions: {
            $elemMatch: {
              date: { $gte: from, $lte: to },
              cancelled: { $ne: true },
            },
          },
        },
      ];
    } else if (from) {
      filter.$or = [
        { repeat: "none", date: { $gte: parseDateOnly(from) } },
        {
          repeat: { $ne: "none" },
          $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: parseDateOnly(from) } }],
        },
        {
          exceptions: {
            $elemMatch: { date: { $gte: from }, cancelled: { $ne: true } },
          },
        },
      ];
    } else if (to) {
      filter.$or = [
        { date: { $lte: parseDateOnly(to) } },
        {
          exceptions: {
            $elemMatch: { date: { $lte: to }, cancelled: { $ne: true } },
          },
        },
      ];
    }
    const items = await Item.find(filter).sort({ date: 1, startTime: 1 }).lean();
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post("/", validate(itemSchema), async (req, res, next) => {
  try {
    if (!(await validateOwnedType(req.body.type, req.user._id))) {
      return res.status(400).json({ message: "Type not found" });
    }
    const item = await Item.create({
      ...dateFields(req.body),
      type: req.body.type,
      owner: req.user._id,
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  validate(idSchema, "params"),
  validate(updateItemSchema),
  async (req, res, next) => {
    try {
      const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });
      if (!item) return res.status(404).json({ message: "Item not found" });

      const updated = { ...item.toObject(), ...req.body };
      const checked = itemSchema.safeParse({
        ...updated,
        type: String(updated.type),
        date: new Date(updated.date).toISOString().slice(0, 10),
        endDate: updated.endDate
          ? new Date(updated.endDate).toISOString().slice(0, 10)
          : undefined,
      });
      if (!checked.success) {
        return res.status(400).json({ message: checked.error.issues[0].message });
      }
      if (!(await validateOwnedType(checked.data.type, req.user._id))) {
        return res.status(400).json({ message: "Type not found" });
      }
      const updatedPattern = { ...dateFields(checked.data), exceptions: [] };
      item.exceptions = item.exceptions.filter((exception) =>
        isOccurrenceOnDate(updatedPattern, exception.occurrenceDate)
      );
      Object.assign(item, dateFields(checked.data), { type: checked.data.type });
      await item.save();
      res.json({ item });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/:id/occurrences/:date",
  validate(occurrenceParamsSchema, "params"),
  validate(occurrenceItemSchema),
  async (req, res, next) => {
    try {
      const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });
      const occurrenceDate = req.params.date;
      if (!item || item.repeat === "none" || !isOccurrenceOnDate(item, occurrenceDate)) {
        return res.status(404).json({ message: "Item occurrence not found" });
      }

      const exceptionCollision = item.exceptions.some(
        (exception) =>
          exception.occurrenceDate !== occurrenceDate &&
          !exception.cancelled &&
          exception.date === req.body.date
      );
      const baseOccurrenceCollision =
        req.body.date !== occurrenceDate &&
        isOccurrenceOnDate(item, req.body.date) &&
        !item.exceptions.some(
          (exception) =>
            exception.occurrenceDate === req.body.date &&
            (exception.cancelled || exception.date !== req.body.date)
        );
      if (
        exceptionCollision ||
        baseOccurrenceCollision
      ) {
        return res.status(400).json({ message: "Another occurrence already exists on that date" });
      }
      if (!(await validateOwnedType(req.body.type, req.user._id))) {
        return res.status(400).json({ message: "Type not found" });
      }

      item.exceptions = item.exceptions.filter(
        (exception) => exception.occurrenceDate !== occurrenceDate
      );
      item.exceptions.push({
        ...req.body,
        occurrenceDate,
        cancelled: false,
      });
      await item.save();
      res.json({ item });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id/occurrences/:date",
  validate(occurrenceParamsSchema, "params"),
  async (req, res, next) => {
    try {
      const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });
      const occurrenceDate = req.params.date;
      if (!item || item.repeat === "none" || !isOccurrenceOnDate(item, occurrenceDate)) {
        return res.status(404).json({ message: "Item occurrence not found" });
      }

      const existing = item.exceptions.find(
        (exception) => exception.occurrenceDate === occurrenceDate
      );
      item.exceptions = item.exceptions.filter(
        (exception) => exception.occurrenceDate !== occurrenceDate
      );
      item.exceptions.push({
        occurrenceDate,
        date: existing?.date || occurrenceDate,
        cancelled: true,
      });
      await item.save();
      res.json({ message: "Item occurrence deleted" });
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", validate(idSchema, "params"), async (req, res, next) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id/done",
  validate(idSchema, "params"),
  validate(doneSchema),
  async (req, res, next) => {
    try {
      const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });
      if (!item) return res.status(404).json({ message: "Item not found" });
      if (!isOccurrenceOnDate(item, req.body.date)) {
        return res.status(400).json({ message: "Date is not an occurrence of this item" });
      }
      const doneDates = new Set(item.doneDates);
      if (doneDates.has(req.body.date)) doneDates.delete(req.body.date);
      else doneDates.add(req.body.date);
      item.doneDates = [...doneDates];
      await item.save();
      res.json({ item });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
