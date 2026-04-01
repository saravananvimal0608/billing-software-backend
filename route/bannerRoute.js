import express from "express";
import superAdmin from "../middleware/superAdminMiddleware.js";
import {
  uploadBanner,
  getBannerForShop,
  deleteBanner,
  getAllBanner
} from "../controller/bannerController.js";
import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post(
  "/",
  upload.single("banner"),
  authMiddleware,
  superAdmin,
  uploadBanner,
);
router.get("/", authMiddleware, adminMiddleware, getBannerForShop);
router.delete("/:id", authMiddleware, superAdmin, deleteBanner);
router.get("/getAll", authMiddleware, superAdmin, getAllBanner);


export default router;
