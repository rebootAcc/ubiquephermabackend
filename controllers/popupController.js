const Popups = require("../models/popupModel");
const path = require("path");
const fs = require("fs");
const NodeCache = require("node-cache");
const generateCustomId = require("../middlewares/generateCustomId");
const { uploadFile, deleteFile } = require("../middlewares/cloudinary");
const cache = new NodeCache({ stdTTL: 300 });

exports.createPopups = async (req, res) => {
  try {
    const popupId = await generateCustomId(Popups, "popupId", "popupId");

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const uploadedFile = req.files.popupImage;

    const uploadResult = await uploadFile(
      uploadedFile.tempFilePath,
      uploadedFile.mimetype
    );

    if (!uploadResult || !uploadResult.secure_url || !uploadResult.public_id) {
      return res.status(500).json({ message: "File upload failed." });
    }

    const popupsData = {
      ...req.body,
      popupId,

      popupImage: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    };

    const newPopup = new Popups(popupsData);

    await newPopup.save();

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allPopups") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(201).json({
      message: "Popup Created Successfully",
      data: newPopup,
    });
  } catch (error) {
    console.error("Error creating Popup:", error);
    res.status(500).json({
      message: "Error creating Popup",
      error: error.message,
    });
  }
};

exports.getPopups = async (req, res) => {
  try {
    const isActiveFilter = req.query.active
      ? req.query.active === "true"
      : null;

    const cacheKey =
      isActiveFilter !== null
        ? `allPopups?active=${isActiveFilter}`
        : "allPopups";

    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }
    let query = {};
    if (isActiveFilter !== null) {
      query.active = isActiveFilter;
    }

    const result = await Popups.find(query).sort({ createdAt: -1 });

    cache.set(
      cacheKey,
      result.map((popup) => popup.toObject())
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching Popup:", error);
    res.status(500).json({
      message: "Error fetching Popup",
      error: error.message,
    });
  }
};

exports.updatePopup = async (req, res) => {
  try {
    const { popupId } = req.params;

    const existingPopup = await Popups.findOne({ popupId });

    if (!existingPopup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    const updatedData = { ...req.body };

    // Handle image update
    if (req.files && req.files.popupImage) {
      const uploadedFile = req.files.popupImage;

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
      if (existingPopup.popupImage && existingPopup.popupImage.public_id) {
        await deleteFile(existingPopup.popupImage.public_id);
      }

      // Update slider image data
      updatedData.popupImage = {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    }

    const updatedPopup = await Popups.findOneAndUpdate(
      { popupId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allPopups") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Popup updated successfully",
      data: updatedPopup,
    });
  } catch (error) {
    console.error("Error updating Popup:", error);
    res.status(500).json({
      message: "Error updating Popup",
      error: error.message,
    });
  }
};

exports.getPopupById = async (req, res) => {
  try {
    const popupId = req.params.popupId;
    const popup = await Popups.findOne({ popupId });

    if (!popup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    res.status(200).json(popup);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Popup",
      error: error.message,
    });
  }
};

exports.deletePopup = async (req, res) => {
  try {
    const { popupId } = req.params;
    const existingPopup = await Popups.findOne({ popupId });
    if (!existingPopup) {
      return res.status(404).json({ message: "Slider not found" });
    }

    if (existingPopup.popupImage && existingPopup.popupImage.public_id) {
      await deleteFile(existingPopup.popupImage.public_id);
    }

    await Popups.findOneAndDelete({ popupId });
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allPopups") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: "Popup deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting Popup:", error);
    res.status(500).json({
      message: "Error deleting Popup",
      error: error.message,
    });
  }
};

exports.setPopupActiveStatus = async (req, res) => {
  try {
    const { popupId } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ message: "Active must be a boolean value" });
    }

    // If the new status is 'active', set all other popups to 'inactive'
    if (active) {
      await Popups.updateMany({ active: true }, { $set: { active: false } });
    }

    const updatedPopup = await Popups.findOneAndUpdate(
      { popupId },
      { $set: { active: active } },
      { new: true }
    );

    if (!updatedPopup) {
      return res.status(404).json({ message: "Popup not found" });
    }

    // Clear relevant cache
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allPopups") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({
      message: `Popup ${active ? "activated" : "deactivated"} successfully`,
      data: updatedPopup,
    });
  } catch (error) {
    console.error("Error updating Popup status:", error);
    res.status(500).json({
      message: "Error updating Popup status",
      error: error.message,
    });
  }
};
