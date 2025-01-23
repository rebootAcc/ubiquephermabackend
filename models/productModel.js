const mongoose = require("mongoose");

const moleculeAndStrengthSchema = new mongoose.Schema({
  moleculeName: { type: String, required: true },
  strengthName: {
    type: String,
    required: true,
  },
});
const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true,
      required: true,
    },
    brandName: {
      type: String,
      required: true,
    },
    productImage: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    categoryName: {
      type: String,
      required: true,
    },
    moleculeAndStrengthName: [moleculeAndStrengthSchema],
    productPrice: { type: String, required: true },

    packagingsizeName: {
      type: String,
      required: true,
    },
    productptr: {
      type: String,
    },
    productpts: {
      type: String,
    },

    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ createdAt: -1, productId: 1 });

module.exports = mongoose.model("Products", productSchema);
