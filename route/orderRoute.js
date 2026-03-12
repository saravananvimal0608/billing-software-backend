import express from 'express'
import { createOrder, getOrders, exportOrdersPDF, exportOrdersExcel } from '../controller/orderController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import adminMiddleware from '../middleware/adminMiddleware.js'
const route = express.Router()

route.post('/', authMiddleware, createOrder)
route.get('/', authMiddleware, adminMiddleware, getOrders)
route.get("/export/pdf", authMiddleware, exportOrdersPDF);
route.get("/export/excel", authMiddleware, exportOrdersExcel);

export default route;
