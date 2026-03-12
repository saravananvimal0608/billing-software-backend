import Order from '../model/orderModel.js'
import Product from '../model/productModel.js';
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export const createOrder = async (req, res) => {
    try {
        const { products } = req.body;
        const shopId = req.user.shopId;

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
                price
            });
        }

        const newOrder = await Order.create({
            shopId,
            products: orderProducts,
            totalPrice
        });

        return res.status(201).json({
            message: "Order Submitted Successfully",
            data: newOrder
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error", stack: error.stack });
    }
};


export const getOrders = async (req, res) => {
    try {

        const shopId = req.user.shopId
        const { startDate, endDate } = req.query

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 5
        const skip = (page - 1) * limit

        let query = { shopId }

        if (startDate && endDate) {

            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)

            query.createdAt = {
                $gte: start,
                $lte: end
            }
        }

        // pagination orders
        const orders = await Order.find(query)
            .populate({
                path: "products.productId",
                select: "productName productPrice"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)

        // total orders count
        const totalOrders = await Order.countDocuments(query)

        // revenue calculate (all orders, not pagination)
        const allOrders = await Order.find(query).select("totalPrice")

        let totalRevenue = 0
        allOrders.forEach(order => {
            totalRevenue += order.totalPrice || 0
        })

        return res.status(200).json({
            message: orders.length === 0 ? "No orders found" : "Orders fetched",
            data: orders,
            totalRevenue,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit)
        })

    } catch (error) {
        return res.status(500).json({ message: "Server Error" })
    }
};


export const exportOrdersPDF = async (req, res) => {
    try {

        const shopId = req.user.shopId;
        const { startDate, endDate } = req.query;

        let query = { shopId };

        if (startDate && endDate) {

            const start = new Date(startDate);
            start.setHours(0,0,0,0);

            const end = new Date(endDate);
            end.setHours(23,59,59,999);

            query.createdAt = { $gte: start, $lte: end };
        }

        const orders = await Order.find(query)
            .populate("products.productId","productName");

        const doc = new PDFDocument();

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition","attachment; filename=orders.pdf");

        doc.pipe(res);

        doc.fontSize(20).text("Order History", { align: "center" });

        doc.moveDown();

        orders.forEach(order => {

            doc.fontSize(12).text(
                `Date: ${new Date(order.createdAt).toLocaleDateString()}`
            );

            order.products.forEach(p => {
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

        let query = { shopId };

        if (startDate && endDate) {

            const start = new Date(startDate);
            start.setHours(0,0,0,0);

            const end = new Date(endDate);
            end.setHours(23,59,59,999);

            query.createdAt = { $gte: start, $lte: end };
        }

        const orders = await Order.find(query)
        .populate({
            path: "products.productId",
            select: "productName productPrice"
        })
        .sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Orders");

        worksheet.columns = [
            { header: "Order Date", key: "date", width: 20 },
            { header: "Products", key: "products", width: 40 },
            { header: "Total Price", key: "price", width: 15 }
        ];

        orders.forEach(order => {

            const productList = order.products
            .map(p => `${p.productId?.productName} x ${p.quantity}`)
            .join(", ");

            worksheet.addRow({
                date: new Date(order.createdAt).toLocaleDateString(),
                products: productList,
                price: order.totalPrice
            });

        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=orders.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {
        res.status(500).json({ message: "Excel export failed" });
    }
};



