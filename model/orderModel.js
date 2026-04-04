import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
        price: Number,
      },
    ],
    paymentMode: {
      type: String,
      required: true,
      enum: ["cash", "card", "upi"],
    },
    totalPrice: Number,
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 }); // after six months data deleted

const Order = mongoose.model("Orders", orderSchema);

export default Order;
