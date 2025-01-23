const Slider = require("../models/sliderModel");
const path = require("path");
const fs = require("fs");
const NodeCache = require("node-cache");
const generateCustomId = require("../middlewares/generateCustomId");
const { uploadFile, deleteFile } = require("../middlewares/cloudinary");
const cache = new NodeCache({ stdTTL: 300 });

exports.createSliders = async (req, res) => {
  try {
    const sliderId = await generateCustomId(Slider, "sliderId", "sliderId");

    if (!req.files || !req.files.sliderImage) {
      return res.status(400).json({ message: "No file was uploaded." });
    }

    const uploadedFile = req.files.sliderImage;

    const uploadResult = await uploadFile(
      uploadedFile.tempFilePath,
      uploadedFile.mimetype
    );

    if (!uploadResult || !uploadResult.secure_url || !uploadResult.public_id) {
      return res.status(500).json({ message: "File upload failed." });
    }

    const slidersData = {
      ...req.body,
      sliderId,
      sliderImage: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    };
    const newSlider = new Slider(slidersData);

    await newSlider.save();

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allSliders") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(201).json({
      message: "Slider Created Successfully",
      data: newSlider,
    });
  } catch (error) {
    console.error("Error creating Slider:", error);
    res.status(500).json({
      message: "Error creating Slider",
      error: error.message,
    });
  }
};

exports.getSlider = async (req, res) => {
  try {
    const isActiveFilter = req.query.active
      ? req.query.active === "true"
      : null;

    const cacheKey =
      isActiveFilter !== null
        ? `allSliders?active=${isActiveFilter}`
        : "allSliders";

    const cachedSliders = cache.get(cacheKey);

    if (cachedSliders) {
      return res.status(200).json(cachedSliders);
    }
    let query = {};
    if (isActiveFilter !== null) {
      query.active = isActiveFilter;
    }
    const result = await Slider.find(query).sort({ createdAt: -1 });
    cache.set(
      cacheKey,
      result.map((slider) => slider.toObject())
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Slider:", error);
    res.status(500).json({
      message: "Error fetching Slider",
      error: error.message,
    });
  }
};

exports.updateSlider = async (req, res) => {
  try {
    const { sliderId } = req.params;

    // Find existing slider
    const existingSlider = await Slider.findOne({ sliderId });
    if (!existingSlider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    // Prepare updated data
    const updatedData = { ...req.body };

    // Handle image update
    if (req.files && req.files.sliderImage) {
      const uploadedFile = req.files.sliderImage;

      // Upload new image to Cloudinary
      const uploadResult = await uploadFile(
        uploadedFile.tempFilePath,
        uploadedFile.mimetype
      );

      if (
        !uploadResult ||
        !uploadResult.secure_url ||
        !uploadResult.public_id
      ) {
        return res.status(500).json({ message: "File upload failed." });
      }

      // Delete old image from Cloudinary
      if (existingSlider.sliderImage && existingSlider.sliderImage.public_id) {
        await deleteFile(existingSlider.sliderImage.public_id);
      }

      // Update slider image data
      updatedData.sliderImage = {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    // Update slider in database
    const updatedSlider = await Slider.findOneAndUpdate(
      { sliderId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    // Invalidate cache
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allSliders") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    // Respond with success
    res.status(200).json({
      message: "Slider updated successfully",
      data: updatedSlider,
    });
  } catch (error) {
    console.error("Error updating Slider:", error);
    res.status(500).json({
      message: "Error updating Slider",
      error: error.message,
    });
  }
};

exports.getSliderById = async (req, res) => {
  try {
    const sliderId = req.params.sliderId;
    const slider = await Slider.findOne({ sliderId });

    if (!slider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    res.status(200).json(slider);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Slider",
      error: error.message,
    });
  }
};

exports.deleteSlider = async (req, res) => {
  try {
    const { sliderId } = req.params;

    const existingSlider = await Slider.findOne({ sliderId });
    if (!existingSlider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    if (existingSlider.sliderImage && existingSlider.sliderImage.public_id) {
      await deleteFile(existingSlider.sliderImage.public_id);
    }

    await Slider.findOneAndDelete({ sliderId });

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allSliders") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Slider deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Slider:", error);
    res.status(500).json({
      message: "Error deleting Slider",
      error: error.message,
    });
  }
};

exports.setSliderActiveStatus = async (req, res) => {
  try {
    const { sliderId } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive must be a boolean value" });
    }

    const updatedSlider = await Slider.findOneAndUpdate(
      { sliderId },
      { $set: { active: active } },
      { new: true }
    );

    if (!updatedSlider) {
      return res.status(404).json({ message: "Slider not found" });
    }

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allSliders") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: `Slider ${active ? "activated" : "deactivated"} successfully`,
      data: updatedSlider,
    });
  } catch (error) {
    console.error("Error updating Slider status:", error);
    res.status(500).json({
      message: "Error updating Slider status",
      error: error.message,
    });
  }
};
