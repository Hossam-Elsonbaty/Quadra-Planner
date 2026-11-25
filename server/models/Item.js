import mongoose from "mongoose";

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
    doneDates: { type: [String], default: [] },
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
