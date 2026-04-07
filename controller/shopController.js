import Category from "../model/categoryModel.js";
import Order from "../model/orderModel.js";
import Product from "../model/productModel.js";
import Report from "../model/reportModel.js";
import Shop from "../model/shopModel.js";
import User from "../model/userModel.js";
import Payment from "../model/paymentModel.js";
import mongoose from "mongoose";
import { confirmationMail } from "../utils/confirmationMail.js";

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
  const { upgradePlanName, stayCurrentPlan ,upgradeStatus} = req.body;

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
        stayCurrentPlan: stayCurrentPlan,
        upgradeStatus: upgradeStatus
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

// update users for change plans isactive
export const enforceUserLimit = async (shopId, plan) => {
  const planLimits = { Basic: 1, Pro: 2, Premium: 3 };
  const maxUsers = planLimits[plan];

  const users = await User.find({
    shopId,
    role: "salesman",
  }).sort({ createdAt: 1 });

  // ✅ Activate allowed users
  const allowedUsers = users.slice(0, maxUsers);
  await User.updateMany(
    { _id: { $in: allowedUsers.map((u) => u._id) } },
    { isActive: true },
  );

  // ❌ Deactivate extra users
  const extraUsers = users.slice(maxUsers);
  await User.updateMany(
    { _id: { $in: extraUsers.map((u) => u._id) } },
    { isActive: false },
  );
};

export const approveUpgrade = async (req, res) => {
  const { shopId, plan } = req.body;
  
  try {
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const today = new Date();

    // =========================================================
    // ✅ CASE 1: Stay Current Plan (Renewal)
    // =========================================================
    if (shop.stayCurrentPlan) {
      const baseDate =
        shop.subscriptionExpiry && shop.subscriptionExpiry > today
          ? shop.subscriptionExpiry
          : today;

      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + 1);

      const updatedShop = await Shop.findByIdAndUpdate(
        shopId,
        {
          subscriptionStartDate: today,
          subscriptionExpiry: newExpiry,
          stayCurrentPlan: false,
          upgradeStatus: false,
        },
        { new: true },
      );

      // 🔥 enforce user limit after renewal
      await enforceUserLimit(shopId, shop.subscriptionPlan);

      return res.status(200).json({
        message: "Plan renewed successfully",
        data: updatedShop,
      });
    }

    // =========================================================
    // ❗ CASE 2: Plan change required
    // =========================================================
    if (!plan) {
      return res.status(400).json({ message: "Plan is required" });
    }

    const currentPlan = shop.subscriptionPlan;

    // =========================================================
    // ✅ CASE 2A: Basic → Pro (Instant Upgrade)
    // =========================================================
    if (currentPlan === "Basic" && plan === "Pro") {
      const startDate = new Date();
      const expiryDate = new Date();

      expiryDate.setMonth(expiryDate.getMonth() + 1);

      const updatedShop = await Shop.findByIdAndUpdate(
        shopId,
        {
          subscriptionPlan: plan,
          subscriptionStartDate: startDate,
          subscriptionExpiry: expiryDate,
          upgradeStatus: false,
          upgradePlanName: null,
          stayCurrentPlan: false,
        },
        { new: true },
      );

      // 🔥 enforce new plan limit
      await enforceUserLimit(shopId, plan);

      return res.status(200).json({
        message: "Plan upgraded to Pro",
        data: updatedShop,
      });
    }

    // =========================================================
    // ✅ CASE 2B: Other upgrades → wait till expiry
    // =========================================================
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        nextPlan: plan,
        upgradeStatus: false,
        upgradePlanName: null,
        stayCurrentPlan: false,
      },
      { new: true },
    );

    // sending mail to admin
    const UserEmail = await User.findOne({ shopId, role: "admin" });
    if (UserEmail) await confirmationMail(UserEmail.email, plan);

    return res.status(200).json({
      message: "Plan will be changed after current plan expiry",
      data: updatedShop,
    });
  } catch (error) {
    console.error(error);
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
    //for example
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

    const shopIds = data.map((s) => s._id);

    // 1. Get admin users
    const adminUsers = await User.find({
      shopId: { $in: shopIds },
      role: "admin",
    }).select("shopId email");

    // 2. Get latest payment per shop
    const payments = await Payment.find({
      shopId: { $in: shopIds },
    })
      .sort({ createdAt: -1 })
      .select("shopId paymentStatus plan createdAt");

    // 3. Build lookup maps
    const adminMap = {};
    adminUsers.forEach((u) => {
      adminMap[u.shopId.toString()] = u.email;
    });

    const paymentMap = {};
    payments.forEach((p) => {
      const key = p.shopId.toString();
      if (!paymentMap[key]) paymentMap[key] = p; // first = latest due to sort
    });

    // 4. Merge with shop data
    const shopsWithEmail = data.map((shop) => {
      const payment = paymentMap[shop._id.toString()];
      return {
        ...shop.toObject(),
        adminEmail: adminMap[shop._id.toString()] || "N/A",
        paymentStatus: payment?.paymentStatus || "pending",
        paymentPlan: payment?.plan || null,
        paymentDate: payment?.createdAt || null,
      };
    });

    return res.status(200).json({
      message: "data fetched",
      data: shopsWithEmail,
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
