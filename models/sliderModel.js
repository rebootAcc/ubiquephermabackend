const mongoose = require("mongoose");
const sliderSchema = new mongoose.Schema(
  {
    sliderId: {
      type: String,
      unique: true,
      required: true,
    },
    sliderName: { type: String, required: true },
    sliderImage: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

sliderSchema.index({ createdAt: -1, sliderId: 1 });

module.exports = mongoose.model("Slider", sliderSchema);
