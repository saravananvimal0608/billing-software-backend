import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addReport, getAllReports,getAllReportsForSuperAdmin,updateReport} from "../controller/reportsController.js";
import superAdmin from "../middleware/superAdminMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addReport);
router.get("/", authMiddleware, getAllReports);
router.get("/get-all-reports", authMiddleware, superAdmin,getAllReportsForSuperAdmin);
router.put('/:id',authMiddleware, superAdmin,updateReport)

export default router;