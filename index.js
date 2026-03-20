import express from "express";
import userRoutes from "./route/userRoute.js";
import dotenv from "dotenv";
import connnectDB from "./config/dbConnect.js";
import categoryRoutes from "./route/categoryRoute.js";
import productRoutes from "./route/productRoute.js";
import orderRoutes from "./route/orderRoute.js";
import shopRoutes from "./route/shopRoute.js";
import reportRoutes from "./route/reportRoute.js";

import dns from 'dns'

dns.setServers(["8.8.8.8", "8.8.4.4"]);

import cors from "cors";
dotenv.config();
connnectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/report", reportRoutes);


app.use("/uploads", express.static("uploads"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
