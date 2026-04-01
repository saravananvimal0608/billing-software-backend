import Category from "../model/categoryModel.js";
import Order from "../model/orderModel.js";
import Product from "../model/productModel.js";
import Report from "../model/reportModel.js";
import Shop from "../model/shopModel.js";
import User from "../model/userModel.js";
import mongoose from "mongoose";

export const getShopDetails = async (req, res) => {
  try {
    const shop = await Shop.findById(req.user.shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }
    return res.status(200).json({
      message: "Shop details fetched",
      data: shop,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const upgradePlanRequest = async (req, res) => {
  const shopId = req.user.shopId;
  const { upgradePlanName, upgradeStatus } = req.body;

  try {
    if (!shopId) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (!upgradePlanName) {
      return res.status(400).json({ message: "Plan name is required" });
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        upgradePlanName: upgradePlanName,
        upgradeStatus: upgradeStatus,
      },
      { new: true },
    );

    if (!updatedShop) {
      return res.status(404).json({ message: "Shop not found in DB" });
    }

    // 4. Success response
    return res.status(200).json({
      message:
        "Your plan will be upgraded within 48 hours. Our team will contact you soon.",
      data: updatedShop,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const approveUpgrade = async (req, res) => {
  const { shopId, plan } = req.body;

  try {
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const planLimits = {
      Basic: 1,
      Pro: 2,
      Premium: 3,
    };

    const maxUsers = planLimits[plan];

    // 🔥 current salesman count
    const users = await User.find({
      shopId,
      role: "salesman",
    }).sort({ createdAt: 1 }); // 👈 oldest first

    const usersCount = users.length;

    // 🔥 if exceeded → delete extra users
    if (usersCount > maxUsers) {
      const usersToDelete = users.slice(maxUsers); // keep first N, delete rest

      await User.deleteMany({
        _id: { $in: usersToDelete.map((u) => u._id) },
      });
    }

    // ✅ update plan
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        subscriptionPlan: plan,
        paymentStatus: "paid",
        subscriptionStartDate: startDate,
        subscriptionExpiry: expiryDate,
        upgradeStatus: false,
        upgradePlanName: null,
      },
      { returnDocument: "after" }
    );

    return res.status(200).json({
      message: "Plan updated successfully (extra users removed)",
      data: updatedShop,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAllShopsCount = async (req, res) => {
  try {
    const shops = await Shop.find();

    if (shops.length === 0) {
      return res.status(200).json({
        message: "No shops found",
        data: [],
      });
    }

    const upgradeRequests = shops.filter((shop) => shop.upgradeStatus === true);
    const basicShops = shops.filter(
      (shop) => shop.subscriptionPlan === "Basic",
    );
    const proShops = shops.filter((shop) => shop.subscriptionPlan === "Pro");
    const premiumShops = shops.filter(
      (shop) => shop.subscriptionPlan === "Premium",
    );

    return res.status(200).json({
      message: "All shops fetched",
      data: {
        upgradeCount: upgradeRequests?.length,
        basicShopsCount: basicShops?.length,
        proShopsCount: proShops?.length,
        premiumShopsCount: premiumShops?.length,
        ShopsCount: shops?.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getAllShops = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const query = {
      shopName: { $regex: search, $options: "i" },
    };

    const data = await Shop.find(query).skip(skip).limit(limit);

    const totalShops = await Shop.countDocuments(query);

    if (data.length === 0) {
      return res.status(200).json({
        message: "no data found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "data fetched",
      data: data,
      totalPages: Math.ceil(totalShops / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const deleteShops = async (req, res) => {
  try {
    const { id, ids } = req.body;

    const shopIds = id ? [id] : ids;

    if (!shopIds || !Array.isArray(shopIds) || shopIds.length === 0) {
      return res.status(400).json({
        message: "Please provide id or ids",
      });
    }

    const objectIds = shopIds.map((id) => new mongoose.Types.ObjectId(id));
    const stringIds = shopIds.map((id) => id.toString());

    await Promise.all([
      Shop.deleteMany({ _id: { $in: objectIds } }),

      Product.deleteMany({
        $or: [{ shopId: { $in: objectIds } }, { shopId: { $in: stringIds } }],
      }),

      Category.deleteMany({
        $or: [{ shopId: { $in: objectIds } }, { shopId: { $in: stringIds } }],
      }),

      User.deleteMany({
        $or: [{ shopId: { $in: objectIds } }, { shopId: { $in: stringIds } }],
      }),

      Report.deleteMany({
        $or: [{ shopId: { $in: objectIds } }, { shopId: { $in: stringIds } }],
      }),

      Order.deleteMany({
        $or: [{ shopId: { $in: objectIds } }, { shopId: { $in: stringIds } }],
      }),
    ]);

    return res.status(200).json({
      message:
        shopIds.length === 1
          ? "Shop deleted successfully"
          : "Shops deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

