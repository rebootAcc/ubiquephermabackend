const mongoose = require("mongoose");
const popupSchema = new mongoose.Schema({
  popupId: {
    type: String,
    unique: true,
    required: true,
  },
  popupName: { type: String, required: true },
  popupImage: {
    secure_url: { type: String, required: true },
    public_id: { type: String, required: true },
  },

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

popupSchema.pre("save", async function (next) {
  const Popup = mongoose.model("Popups", popupSchema);

  if (this.active) {
    await Popup.updateMany({ active: true }, { active: false });
  }

  next();
});

popupSchema.index({ createdAt: -1, popupId: 1 });

module.exports = mongoose.model("Popups", popupSchema);
