import mongoose from "mongoose";

const typeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    color: {
      type: String,
      required: true,
      match: /^#[0-9a-fA-F]{6}$/,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

typeSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.model("Type", typeSchema);
