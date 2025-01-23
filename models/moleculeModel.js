const mongoose = require("mongoose");

const moleculeSchema = new mongoose.Schema(
  {
    moleculeId: {
      type: String,
      unique: true,
      required: true,
    },
    moleculeName: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

moleculeSchema.index({ createdAt: -1, moleculeId: 1 });

module.exports = mongoose.model("Molecule", moleculeSchema);
