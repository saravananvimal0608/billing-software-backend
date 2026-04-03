import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true },
    ownerName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    address: { type: String },
    subscriptionPlan: {
      type: String,
      enum: ["Basic", "Pro", "Premium"],
      default: "Basic",
    },
    bannerType: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    subscriptionStartDate: { type: Date },
    subscriptionExpiry: { type: Date },
    upgradePlanName: {
      type: String,
    },
    upgradeStatus: {
      type: Boolean,
      default: false,
    },
    stayCurrentPlan:{
      type:Boolean,
      default:false
    },
    nextPlan: {
      type: String,
      enum: ["Basic", "Pro", "Premium"],
      default: null,
    },
  },
  { timestamps: true },
);

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;
