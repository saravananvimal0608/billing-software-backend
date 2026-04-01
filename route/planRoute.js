import express from "express";
import {
  addPlan,
  getPlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
} from "../controller/planController.js";

const router = express.Router();

// CREATE
router.post("/add", addPlan);

// READ
router.get("/", getPlans);
router.get("/:id", getSinglePlan);

// UPDATE
router.put("/:id", updatePlan);

// DELETE
router.delete("/:id", deletePlan);

export default router;