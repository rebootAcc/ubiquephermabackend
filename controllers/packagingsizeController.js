const generateCustomId = require("../middlewares/generateCustomId");
const PackagingSize = require("../models/packagingSizeModel");

exports.createPackagingSize = async (req, res) => {
  try {
    const { packagingsizeName } = req.body;

    const packagingsizeId = await generateCustomId(
      PackagingSize,
      "packagingsizeId",
      "packagingsizeId"
    );
    const newPackagingSize = new PackagingSize({
      packagingsizeId,
      packagingsizeName,
    });

    await newPackagingSize.save();
    res.status(201).json({
      message: " packaging size created successfully",
      newPackagingSize,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "packaging size Name already exists. Please try another name.",
      });
    }
    console.error("Error creating  packaging size:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPackagingSize = async (req, res) => {
  try {
    const packagingsizes = await PackagingSize.find().sort({ createdAt: -1 });
    res.status(200).json(packagingsizes);
  } catch (error) {
    console.error("Error fetching packaging size:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updatePackagingSize = async (req, res) => {
  try {
    const { packagingsizeId } = req.params;
    const { packagingsizeName } = req.body;

    const packagingsizeUpdate = await PackagingSize.findOne({
      packagingsizeId,
    });
    if (!packagingsizeUpdate) {
      return res.status(404).json({ message: "packaging size not found" });
    }

    packagingsizeUpdate.packagingsizeName =
      packagingsizeName || packagingsizeUpdate.packagingsizeName;

    await packagingsizeUpdate.save();
    res.status(200).json({
      message: "packaging size updated successfully",
      packagingsizeUpdate,
    });
  } catch (error) {
    console.error("Error updating packaging size:", error.message);
    res.status(500).json({ message: "Error updating packaging size", error });
  }
};

exports.deletePackagingSize = async (req, res) => {
  try {
    const { packagingsizeId } = req.params;

    const packagingsizeDelete = await PackagingSize.findOne({
      packagingsizeId,
    });
    if (!packagingsizeDelete) {
      return res.status(404).json({ message: "Packaging Size not found" });
    }

    // Delete brand from database
    await PackagingSize.findOneAndDelete({ packagingsizeId });
    res.status(200).json({ message: "Packaging Size deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Packaging Size", error });
  }
};
