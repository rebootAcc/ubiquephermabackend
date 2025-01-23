const mongoose = require("mongoose");

const packagingsizeSchema = new mongoose.Schema(
  {
    packagingsizeId: {
      type: String,
      unique: true,
      required: true,
    },
    packagingsizeName: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

packagingsizeSchema.index({ createdAt: -1, packagingsizeId: 1 });

module.exports = mongoose.model("PackagingSize", packagingsizeSchema);
