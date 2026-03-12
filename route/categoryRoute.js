
import { addCategory, getAllCategories, updateCategory, deleteCategory, getSingleCategory, getCategoriesWithoutPagination ,bulkDeleteCategories} from '../controller/categoryController.js'
import express from 'express'
import adminMiddleware from './../middleware/adminMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()

router.get("/withoutPagination", authMiddleware, getCategoriesWithoutPagination);
router.post('/add', authMiddleware, adminMiddleware, addCategory)
router.get("/", authMiddleware, getAllCategories);
router.get("/:id", authMiddleware, getSingleCategory);
router.put("/:id", authMiddleware, adminMiddleware, updateCategory);
router.delete("/bulk", authMiddleware, adminMiddleware, bulkDeleteCategories);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);


export default router