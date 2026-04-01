import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  bannerType: {
    type: String,
    enum: ["All","Basic", "Pro", "Premium"],
    required: true,
  },
  bannerImage: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;