
import Payment from "../model/paymentModel.js";
import Plan from "../model/plansModel.js";
import Shop from "../model/shopModel.js";

export const getPaymentDetails = async (req, res) => {
  try {
    const { startDate, endDate, status, search } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Search shops
    const shops = await Shop.find({
      shopName: { $regex: search || "", $options: "i" },
    }).select("_id shopName subscriptionPlan");

    const shopIds = shops.map((s) => s._id);

    // Plan Map (planName → amount)
    const plans = await Plan.find().select("planName amount");
    const planMap = {};
    plans.forEach((p) => {
      planMap[p.planName] = p.amount;
    });

    // Default: last 6 months filter
    let planStartDate = new Date();
    planStartDate.setMonth(planStartDate.getMonth() - 6);

    let query = {
      shopId: { $in: shopIds },
      createdAt: {
        $gte: planStartDate,
      },
    };

    // Date filter override
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: start > planStartDate ? start : planStartDate,
        $lte: end,
      };
    }

    // Status filter
    if (status) {
      query.paymentStatus = status;
    }

    // Search by shop name — filter shopIds into query
    if (search) {
      const shops = await Shop.find({
        shopName: { $regex: search, $options: "i" },
      }).select("_id");
      query.shopId = { $in: shops.map((s) => s._id) };
    }

    // Parallel queries
    const [totalPayments, payments, summaryAgg] = await Promise.all([
      Payment.countDocuments(query),

      Payment.find(query)
        .populate("shopId", "shopName subscriptionPlan")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Summary format
    const summary = { paid: 0, pending: 0 };
    summaryAgg.forEach((item) => {
      if (item._id === "paid") summary.paid = item.count;
      if (item._id === "pending") summary.pending = item.count;
    });

    // Enrich payments with plan amount
    const enrichedPayments = payments.map((item) => ({
      ...item,
      amount: planMap[item.plan] ?? planMap[item.shopId?.subscriptionPlan] ?? 0,
    }));

    return res.status(200).json({
      message: enrichedPayments.length === 0 ? "No payments found" : "Payments fetched",
      data: enrichedPayments,
      summary,
      currentPage: page,
      totalPages: Math.ceil(totalPayments / limit),
      planLimit: "6 months",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { shopId, plan, paymentStatus, startDate, expiryDate } = req.body;

    if (!shopId || !plan || !paymentStatus || !startDate || !expiryDate) {
      return res.status(400).json({
        message: "All fields are required including shopId",
      });
    }

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found",
      });
    }

    if (plan === "Basic") {
      return res.status(400).json({
        message: "Basic plan doesn't require payment",
      });
    }

    // 🧠 Month range
    const startOfMonth = new Date(startDate);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startDate);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // 🔥 Find existing payment in same month
    let existingPayment = await Payment.findOne({
      shopId,
      startDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    let payment;

    if (existingPayment) {
      // ✅ UPDATE (pending → paid)
      existingPayment.plan = plan;
      existingPayment.paymentStatus = paymentStatus;
      existingPayment.startDate = startDate;
      existingPayment.expiryDate = expiryDate;

      payment = await existingPayment.save();
    } else {
      payment = await Payment.create({
        shopId,
        plan,
        paymentStatus,
        startDate,
        expiryDate,
      });
    }

    return res.status(200).json({
      message: existingPayment
        ? "Payment updated for this month"
        : "Payment created",
      data: payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack,
    });
  }
};
