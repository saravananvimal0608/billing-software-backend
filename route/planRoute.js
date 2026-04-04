import express from "express";
import {
  addPlan,
  getPlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
} from "../controller/planController.js";
import superAdmin from "../middleware/superAdminMiddleware.js";
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router();

router.post("/add",authMiddleware ,superAdmin, addPlan);
router.get("/", getPlans);
router.get("/:id", authMiddleware,superAdmin,getSinglePlan);
router.put("/:id",authMiddleware,superAdmin, updatePlan);
router.delete("/:id",authMiddleware,superAdmin, deletePlan);

export default router;