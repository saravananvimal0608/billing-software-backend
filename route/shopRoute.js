import {
  getShopDetails,
  upgradePlanRequest,
  approveUpgrade,
  getAllShopsCount,
  getAllShops,
  deleteShops,
} from "../controller/shopController.js";
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import superAdmin from "../middleware/superAdminMiddleware.js";

const router = express.Router();

router.get("/getallshopscount", authMiddleware, superAdmin, getAllShopsCount);
router.get("/", authMiddleware, getShopDetails);
router.post("/", authMiddleware, upgradePlanRequest);
router.post("/approve", authMiddleware, superAdmin, approveUpgrade);
router.get("/getallshops", authMiddleware, superAdmin, getAllShops);
router.delete("/", authMiddleware, superAdmin, deleteShops);

export default router;
