import Order from "../model/orderModel.js";
import Product from "../model/productModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import Shop from "../model/shopModel.js";

export const createOrder = async (req, res) => {
  try {
    const { products, paymentMode } = req.body;
    const shopId = req.user.shopId;

    if (!paymentMode) {
      return res.status(400).json({ message: "Payment Mode Required" });
    }
    if (!products || products.length === 0) {
      return res.status(400).json({ message: "Products required" });
    }

    const merged = {};

    for (let item of products) {
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ message: "Invalid product data" });
      }

      if (merged[item.productId]) {
        merged[item.productId] += item.quantity;
      } else {
        merged[item.productId] = item.quantity;
      }
    }

    let totalPrice = 0;
    let orderProducts = [];

    for (let id in merged) {
      const productData = await Product.findById(id);

      if (!productData) {
        return res.status(404).json({ message: "Product not found" });
      }

      const quantity = merged[id];
      const price = productData.productPrice;

      totalPrice += price * quantity;

      orderProducts.push({
        productId: id,
        quantity,
        price,
      });
    }

    const newOrder = await Order.create({
      shopId,
      products: orderProducts,
      paymentMode,
      totalPrice,
    });

    return res.status(201).json({
      message: "Order Submitted Successfully",
      data: newOrder,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Server Error", stack: error.stack });
  }
};

export const getOrders = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate, paymentMode } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // 🔥 get shop plan
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const subscriptionPlan = shop.subscriptionPlan;

    // 🔥 plan based history limit
    let planStartDate = new Date();

    if (subscriptionPlan === "Basic") {
      planStartDate.setDate(planStartDate.getDate() - 15);
    } else if (subscriptionPlan === "Pro") {
      planStartDate.setMonth(planStartDate.getMonth() - 3);
    } else if (subscriptionPlan === "Premium") {
      planStartDate.setMonth(planStartDate.getMonth() - 6);
    }

    let query = { shopId };

    // 🔥 always restrict by plan
    query.createdAt = {
      $gte: planStartDate,
    };

    // 🔥 if user selects custom date
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

    // 🔥 payment mode filter
    if (paymentMode) {
      query.paymentMode = paymentMode;
    }

    // 🔥 payment modes list
    const pModes = await Order.distinct("paymentMode", { shopId });

    // 🔥 paginated orders
    const orders = await Order.find(query)
      .populate({
        path: "products.productId",
        select: "productName productPrice",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // ⚡ performance

    // 🔥 total orders count
    const totalOrders = await Order.countDocuments(query);

    // 🔥 total revenue (only allowed range)
    const revenueData = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    return res.status(200).json({
      message: orders.length === 0 ? "No orders found" : "Orders fetched",
      data: orders,
      totalRevenue,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      paymentMode: pModes,
      planLimit:
        subscriptionPlan === "Basic"
          ? "15 days"
          : subscriptionPlan === "Pro"
          ? "3 months"
          : "6 months",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

export const exportOrdersPDF = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate } = req.query;

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const subscriptionPlan = shop?.subscriptionPlan;

    if (subscriptionPlan === "Basic") {
      return res.status(400).json({
        message: "upgrade to pro or premium to use this feature",
      });
    }

    let query = { shopId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query).populate(
      "products.productId",
      "productName",
    );

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=orders.pdf");

    doc.pipe(res);

    doc.fontSize(20).text("Order History", { align: "center" });

    doc.moveDown();

    orders.forEach((order) => {
      doc
        .fontSize(12)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);

      order.products.forEach((p) => {
        doc.text(`- ${p.productId?.productName} x ${p.quantity}`);
      });

      doc.text(`Total: ₹${order.totalPrice}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "PDF export failed" });
  }
};

export const exportOrdersExcel = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { startDate, endDate } = req.query;

    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }
    const subscriptionPlan = shop?.subscriptionPlan;

    if (subscriptionPlan === "Basic") {
      return res.status(400).json({
        message: "upgrade to pro or premium to use this feature",
      });
    }

    let query = { shopId };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query)
      .populate({
        path: "products.productId",
        select: "productName productPrice",
      })
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    worksheet.columns = [
      { header: "Order Date", key: "date", width: 20 },
      { header: "Products", key: "products", width: 40 },
      { header: "Price", key: "price", width: 15 },
    ];

    orders.forEach((order) => {
      const productList = order.products
        .map((p) => `${p.productId?.productName} x ${p.quantity}`)
        .join(", ");

      worksheet.addRow({
        date: new Date(order.createdAt).toLocaleDateString(),
        products: productList,
        price: order.totalPrice,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    res.status(500).json({ message: "Excel export failed" });
  }
};
