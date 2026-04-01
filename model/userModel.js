import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: function () {
      return this.role !== "superadmin";
    },
  },
  role: {
    type: String,
    default: "salesman",
    required: true,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  otp: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  tempEmail: {
    type: String,
  },
});
const User = mongoose.model("User", userSchema);
export default User;
