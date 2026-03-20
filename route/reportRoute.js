import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { addReport, getAllReports } from "../controller/reportsController.js";
const router = express.Router();

router.post("/", authMiddleware, addReport);
router.get("/", authMiddleware, getAllReports);

export default router;