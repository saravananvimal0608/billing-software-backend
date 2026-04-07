import Banner from "../model/bannerModel.js";
import Shop from "../model/shopModel.js";
import cloudinary from "../config/cloudinary.js";

export const uploadBanner = async (req, res) => {
    const { bannerType, position } = req.body;
  try {
  if (!bannerType || !position) {
    return res.status(400).json({ message: "bannerType & position required" });
  }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    // Collect all uploaded files from all fields
    const allFiles = [];
    Object.keys(req.files).forEach((key) => {
      req.files[key].forEach((file) => {
        allFiles.push({ path: file.path, public_id: file.filename });
      });
    });

    // Save each image as a separate Banner document
    const banners = await Banner.insertMany(
      allFiles.map(({ path, public_id }) => ({
        bannerType,
        position,
        bannerImage: path,
        public_id,
      }))
    );

    return res.status(200).json({
      message: "Banners uploaded successfully",
      data: banners,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Upload failed",
      error: error.message,
    });
  }
};

export const getBannerForShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.user.shopId);

    let banners = await Banner.find({
      $or: [{ bannerType: shop.subscriptionPlan }, { bannerType: "All" }],
    });

    return res.status(200).json({
      data: banners,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  const { id } = req.params;

  try {
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // delete from cloudinary
    await cloudinary.uploader.destroy(banner.public_id);

    // delete from DB
    await Banner.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Banner deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getAllBanner = async (req, res) => {
  try {
    const allBanner = await Banner.find();

    if (allBanner.length === 0) {
      return res.status(200).json({ message: "no data found" });
    }

    return res.status(200).json({
      message: "data fetched success",
      data: allBanner,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
