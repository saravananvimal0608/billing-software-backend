// model/subscriptionHistoryModel.js

import mongoose from "mongoose";

const paymentModelSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
    plan: String,
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

//  Auto delete after 6 months
paymentModelSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 * 6 }, // 6 months
);
const Payment = mongoose.model("payment", paymentModelSchema);
export default Payment;
