// model/subscriptionHistoryModel.js

import mongoose from "mongoose";

const subscriptionHistorySchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    plan: String,
    amount: Number,
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    startDate: Date,
    expiryDate: Date,
  },
  { timestamps: true },
);
const subscriptionHistory = mongoose.model(
  "SubscriptionHistory",
  subscriptionHistorySchema,
);
export default subscriptionHistory;
