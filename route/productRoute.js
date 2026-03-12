
import { addProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct, getProductsByCategory, getProductWithoutPagination, bulkDeleteProducts } from '../controller/productController.js'
import adminMiddleware from './../middleware/adminMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';
import express from 'express'

const router = express.Router()


router.post('/add', authMiddleware, adminMiddleware, addProduct)
router.get("/", authMiddleware, getAllProducts);
router.get('/withoutPagination', authMiddleware, getProductWithoutPagination)
router.get("/:id", authMiddleware, getSingleProduct);
router.put("/:id", authMiddleware, adminMiddleware, updateProduct);
router.delete("/bulk", authMiddleware, adminMiddleware, bulkDeleteProducts);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);
router.get("/category/:categoryId", authMiddleware, getProductsByCategory);



export default router