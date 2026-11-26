import mongoose from "mongoose";

const occurrenceExceptionSchema = new mongoose.Schema(
  {
    occurrenceDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    cancelled: { type: Boolean, default: false },
    title: { type: String, trim: true },
    type: { type: mongoose.Schema.Types.ObjectId, ref: "Type" },
    startTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
    notes: { type: String, trim: true },
    repeat: {
      type: String,
      enum: ["none", "weekly", "monthly", "yearly"],
      required: true,
    },
    endDate: { type: Date },
    reminderMinutesBefore: {
      type: Number,
      min: 1,
      max: 10080,
      validate: Number.isInteger,
    },
    doneDates: { type: [String], default: [] },
    exceptions: { type: [occurrenceExceptionSchema], default: [] },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

itemSchema.index({ owner: 1, date: 1, repeat: 1 });

export default mongoose.model("Item", itemSchema);
