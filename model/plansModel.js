import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  planName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  validity: {
    type: String, 
  },
  benefits: {
    type: [String],
  },
  planBtn: {
    type: String,
    required: true,
  },
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;