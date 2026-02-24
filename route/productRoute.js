
import { addProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct, getProductsByCategory } from '../controller/productController.js'
import adminMiddleware from './../middleware/adminMiddleware.js';
import tempMiddleWare from './../middleware/tempMiddleWare.js';
import express from 'express'
import { upload } from '../middleware/multer.js'

const router = express.Router()


router.post('/add', tempMiddleWare, adminMiddleware, upload.single("image"), addProduct)
router.get("/", tempMiddleWare, getAllProducts);
router.get("/:id", tempMiddleWare, getSingleProduct);
router.put("/:id", tempMiddleWare, adminMiddleware, updateProduct);
router.delete("/:id", tempMiddleWare, adminMiddleware, deleteProduct);
router.get("/category/:categoryId", tempMiddleWare, getProductsByCategory);



export default router