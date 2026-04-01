import Banner from "../model/bannerModel.js";
import Shop from "../model/shopModel.js";
import cloudinary from "../config/cloudinary.js";

export const uploadBanner = async (req, res) => {
  const { bannerType } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imageUrl = req.file.path;

    const banner = await Banner.findOneAndUpdate(
      { bannerType: bannerType },
      { bannerImage: imageUrl },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      message: "Banner uploaded successfully",
      data: banner,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Upload failed",
      error: error.message,
      stack: error.stack,
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
    if (banner.public_id) {
      await cloudinary.uploader.destroy(banner.public_id);
    }

    // delete from DB
    await Banner.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Image deleted successfully",
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
