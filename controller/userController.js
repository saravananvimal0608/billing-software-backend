import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { emailSend } from "../utils/emailSend.js";
import Shop from "../model/shopModel.js";
import { subscriptionPlan } from "../utils/subscriptionPlan.js";

export const createAdmin = async (req, res) => {
  const { shopName, ownerName, mobileNumber, address, email, password } =
    req.body;

  try {
    if (
      !shopName ||
      !ownerName ||
      !mobileNumber ||
      !address ||
      !email ||
      !password
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //  check existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Try different email",
      });
    }

    //  create shop
    const shop = await Shop.create({
      shopName,
      ownerName,
      mobileNumber,
      address,
    });

    //  hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      shopId: shop._id,
      role: "admin",
      otp,
      otpExpiry,
      isVerified: false,
    });

    // send OTP
    const isSent = await emailSend(
      newUser,
      otp,
      "Register Account",
      "Register Your Account",
    );

    if (!isSent) {
      return res.status(500).json({
        message: "Failed to send email",
      });
    }

    return res.status(200).json({
      message: "OTP sent successfully. Please verify your email",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// common for all verify otp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      $or: [{ email }, { tempEmail: email }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    //  if updating email
    if (user.tempEmail) {
      user.email = user.tempEmail;
      user.tempEmail = null;
    }

    // normal verify
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

export const createSalesman = async (req, res) => {
  const shopId = req.user.shopId;
  const { email, password } = req.body;

  try {
    const shopDetails = await Shop.findById(shopId);

    if (!shopDetails) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // restricted plan based users create
    const subscriptionPlan = shopDetails.subscriptionPlan;

    const planLimits = {
      Basic: 1,
      Pro: 2,
      Premium: 3,
    };

    const maxUsers = planLimits[subscriptionPlan] || 0;

    const usersCount = await User.countDocuments({
      shopId,
      role: "salesman",
    });
    if (usersCount >= maxUsers) {
      return res.status(400).json({
        message: `Your ${subscriptionPlan} plan allows only ${maxUsers} users. Please upgrade.`,
      });
    }

    // restricted plan based users create end //

    // validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }

    // check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Try different email",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // create user
    const salesman = await User.create({
      email,
      password: hashedPassword,
      shopId,
      otp,
      otpExpiry,
      isVerified: false,
    });

    // send OTP
    const isSent = await emailSend(
      salesman,
      otp,
      "Register Account",
      "Register Your Account",
    );

    if (!isSent) {
      return res.status(500).json({
        message: "Failed to send email",
      });
    }

    return res.status(200).json({
      message: "OTP sent successfully. Please verify your email",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      stack: error.stack,
    });
  }
};

export const singleUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        status: false,
      });
    }
    return res.status(200).json({
      message: "User fetched successfully",
      status: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { shopId } = req.user;
  const { email } = req.body;

  try {
    // ✅ email check
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // ✅ find user
    const user = await User.findOne({ _id: id, shopId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ check email already exists globally
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser._id.toString() !== id) {
      return res
        .status(400)
        .json({ message: "Email already in use. Try different email" });
    }

    // ✅ OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // ✅ IMPORTANT: don't update email directly
    user.tempEmail = email;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.isVerified = false;

    await user.save();

    const isSent = await emailSend(
      user,
      otp,
      "Verify your email",
      "Verify your email",
    );

    if (!isSent) {
      return res.status(500).json({
        message: "Failed to send email",
      });
    }

    return res.status(200).json({
      message: "OTP sent to new email. Please verify to update email",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      stack: error.stack,
    });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and Password are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    if (!existingUser.isActive) {
      return res.status(403).json({
        success: false,
         message: "Account deactivated. Contact admin or upgrade plan.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({
        message: "JWT secret key not configured",
      });
    }

    const payload = {
      sub: existingUser._id,
      username: existingUser.email,
      role: existingUser.role,
      ...(existingUser.role !== "superadmin" && {
        shopId: existingUser.shopId ? existingUser.shopId : "",
      }),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "24h",
    });

    // subscription (declare outside)
    let subscription = null;

    if (existingUser.role !== "superadmin") {
      subscription = await subscriptionPlan(
        existingUser.role,
        existingUser.shopId,
      );
    }
    return res.status(200).json({
      data: email,
      message: "User logged in successfully",
      token,
      role: existingUser.role,
      ...(existingUser.role !== "superadmin" && {
        subscriptionPlan: subscription,
      }),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      stack: error.stack,
    });
  }
};

export const allUserByShop = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const query = {
      shopId: shopId,
      email: { $regex: search, $options: "i" },
    };

    const users = await User.find(query).skip(skip).limit(limit);

    const totalUsers = await User.countDocuments(query);

    return res.status(200).json({
      data: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const bulkDeleteUser = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.status(400).json({ message: "no User selected" });
    }

    await User.deleteMany({
      _id: { $in: ids },
    });
    return res.status(200).json({
      message: "Users deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "User id is required",
      });
    }

    const existingUser = await User.findByIdAndDelete({ _id: id, shopId });

    if (!existingUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // OTP generate
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // store OTP
    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    // send email
    const isSent = await emailSend(
      user,
      otp,
      "Forgot Password",
      "reset your password",
    );

    if (!isSent) {
      return res.status(500).json({
        message: "Failed to send OTP",
      });
    }

    return res.status(200).json({
      message: "OTP sent to your email",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    //  OTP check
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    //  hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //  update password
    user.password = hashedPassword;

    // clear OTP
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const createSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email And Password Are Required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = await User.create({
      email,
      password: hashedPassword,
      role: "superadmin",
    });

    return res
      .status(201)
      .json({ message: "Super Admin Created Successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
};

export const allUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const query = {
      email: { $regex: search, $options: "i" },
    };

    const users = await User.find(query).skip(skip).limit(limit);

    const totalUsers = await User.countDocuments(query);

    return res.status(200).json({
      data: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers: totalUsers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
