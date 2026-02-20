
import { addCategory, getAllCategories, updateCategory, deleteCategory,getSingleCategory } from '../controller/categoryController.js'
import express from 'express'
import adminMiddleware from './../middleware/adminMiddleware.js';
import tempMiddleWare from './../middleware/tempMiddleWare.js';

const router = express.Router()


router.post('/add', tempMiddleWare, adminMiddleware, addCategory)
router.get("/", tempMiddleWare, getAllCategories);
router.get("/single/:id", tempMiddleWare, adminMiddleware, getSingleCategory);
router.put("/:id", tempMiddleWare, adminMiddleware, updateCategory);
router.delete("/:id", tempMiddleWare, adminMiddleware, deleteCategory);
// router.get("/getall", tempMiddleWare, adminMiddleware, getProductsByCategory);



export default router