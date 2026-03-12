import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: Number,
            price: Number
        }
    ],
    totalPrice: Number
}, { timestamps: true });

const Order = mongoose.model("Orders", orderSchema)

export default Order;
