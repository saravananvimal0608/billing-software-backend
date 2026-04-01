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
      enum: ["Paid", "Pending"],
      default: "Paid",
    },
    startDate: Date,
    expiryDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model(
  "SubscriptionHistory",
  subscriptionHistorySchema
);