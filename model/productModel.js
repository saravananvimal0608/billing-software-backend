import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    productPrice: {
        type: Number,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema);
export default Product;