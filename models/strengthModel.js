const mongoose = require("mongoose");
const strengthSchema = new mongoose.Schema(
  {
    strengthId: {
      type: String,
      unique: true,
      required: true,
    },
    strengthName: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

strengthSchema.index({ createdAt: -1, strengthId: 1 });

module.exports = mongoose.model("Strength", strengthSchema);
