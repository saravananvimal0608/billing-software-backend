import express from "express";
import {
  addPlan,
  getPlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
} from "../controller/planController.js";
import superAdmin from "../middleware/superAdminMiddleware.js";

const router = express.Router();

router.post("/add",superAdmin, addPlan);
router.get("/",getPlans);
router.get("/:id", superAdmin,getSinglePlan);
router.put("/:id",superAdmin, updatePlan);
router.delete("/:id",superAdmin, deletePlan);

export default router;