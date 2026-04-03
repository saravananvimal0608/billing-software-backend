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
  const { upgradePlanName, upgradeStatus, stayCurrentPlan } = req.body;

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
        stayCurrentPlan: stayCurrentPlan,
      },
      { new: true },
    );

    if (!updatedShop) {
      return res.status(404).json({ message: "Shop not found in DB" });
    }

    // 4. Success response
    return res.status(200).json({
      message: stayCurrentPlan
        ? "Your renewal request has been sent. Your current plan will be extended within 24 hours."
        : "Your upgrade request has been sent. Our team will process it within 24 hours.",
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
  const { shopId, plan, paymentStatus } = req.body;

  try {
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    if (!shop.stayCurrentPlan && !paymentStatus) {
      return res.status(400).json({ message: "payment status required" });
    }

    //  CASE 1: Stay Current Plan (Renewal)
    if (shop.stayCurrentPlan) {
      const today = new Date();

      const baseDate =
        shop.subscriptionExpiry && shop.subscriptionExpiry > today
          ? shop.subscriptionExpiry
          : today;

      const newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + 30);

      const updatedShop = await Shop.findByIdAndUpdate(
        shopId,
        {
          subscriptionStartDate: today,
          subscriptionExpiry: newExpiry,
          paymentStatus: paymentStatus,
          stayCurrentPlan: false,
          upgradeStatus: false,
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Plan renewed successfully",
        data: updatedShop,
      });
    }

    //  CASE 2: Change Plan
    if (!plan) {
      return res.status(400).json({ message: "Plan is required" });
    }

    const currentPlan = shop.subscriptionPlan;
    const today = new Date();
    const isExpired =
      !shop.subscriptionExpiry || shop.subscriptionExpiry < today;

    //  CASE 2A: Basic → Pro (Instant)
    if (currentPlan === "Basic" && plan === "Pro") {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      // user limit logic
      const planLimits = { Basic: 1, Pro: 2, Premium: 3 };
      const maxUsers = planLimits[plan];

      const users = await User.find({
        shopId,
        role: "salesman",
      }).sort({ createdAt: 1 });

      if (users.length > maxUsers) {
        const usersToDelete = users.slice(maxUsers);
        await User.deleteMany({
          _id: { $in: usersToDelete.map((u) => u._id) },
        });
      }

      const updatedShop = await Shop.findByIdAndUpdate(
        shopId,
        {
          subscriptionPlan: plan,
          paymentStatus,
          subscriptionStartDate: startDate,
          subscriptionExpiry: expiryDate,
          upgradeStatus: false,
          upgradePlanName: null,
          stayCurrentPlan: false,
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Plan upgraded to Pro",
        data: updatedShop,
      });
    }

   

    //  CASE 2C: All other cases → WAIT till expiry
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        nextPlan: plan, // 👈 IMPORTANT
        paymentStatus,
        upgradeStatus: false,
        upgradePlanName: null,
        stayCurrentPlan: false,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Plan will be changed after current plan expiry",
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

    let data = await Shop.find(query).skip(skip).limit(limit);

    const totalShops = await Shop.countDocuments(query);

    const today = new Date();

    //  AUTO PLAN SWITCH LOGIC
    for (let shop of data) {
      if (
        shop.subscriptionExpiry &&
        shop.subscriptionExpiry < today &&
        shop.nextPlan
      ) {
        const newStart = new Date();
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        shop.subscriptionPlan = shop.nextPlan;
        shop.subscriptionStartDate = newStart;
        shop.subscriptionExpiry = newExpiry;
        shop.nextPlan = null;

        await shop.save();
      }
    }

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
