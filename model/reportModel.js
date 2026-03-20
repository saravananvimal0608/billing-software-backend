import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
    },
     description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
    },
  },
  {
    timestamps: true,
  },
);

reportSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 2592000 } //30 days
);


const Report = mongoose.model("Report", reportSchema);
export default Report;
