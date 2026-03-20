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
      return res.status(400).json({ message: "All Field Are Required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User Already Exists Try Different Email" });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // creating shop inside this user table for set a shopId in user Schem
    const shop = await Shop.create({
      shopName,
      ownerName,
      mobileNumber,
      address,
      subscriptionExpiry: expiryDate, // 30 days
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email: email,
      password: hashedPassword,
      shopId: shop._id,
      role: "admin",
    });
    await newUser.save();
    return res.status(201).json({ message: "Shop Registered successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Server error",
        error: error.message,
        stack: error.stack,
      });
  }
};

export const createSalesman = async (req, res) => {
  const { email, password } = req.body;
  const shopId = req.user.shopId;

  if (!email || !password) {
    return res.status(400).json({ message: "Email And Password Are Required" });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User Already Exists Try Different Email" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const salesman = await User.create({
    email,
    password: hashedPassword,
    shopId,
  });

  return res.status(201).json({ message: "User Created Successfully" });
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
  console.log(email);

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ _id: id, shopId }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email === email) {
      return res.status(200).json({ message: "No changes detected" });
    }

    const existingUser = await User.findOne({ email, shopId });

    if (existingUser && existingUser._id.toString() !== id) {
      return res
        .status(400)
        .json({ message: "User already exists. Try different email" });
    }

    user.email = email;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      data: user,
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
      shopId: existingUser.shopId ? existingUser.shopId : "",
      role: existingUser.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "24h",
    });

    const subscription = await subscriptionPlan(existingUser.role,existingUser.shopId);

    return res.status(200).json({
      data: email,
      message: "User logged in successfully",
      token,
      role: existingUser.role,
      subscriptionPlan: subscription,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      stack: error.stack,
    });
  }
};

export const allUser = async (req, res) => {
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

export const updatePassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  try {
    if (!user) {
      return res.status(404).json({
        message: "user not found",
        status: false,
      });
    }

    const token = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = token;
    user.resetPasswordExpire = Date.now() + 3600000;

    await user.save();

    emailSend(user, token, res);
  } catch (error) {
    return res.status(500).json({ message: error.message, stack: error.stack });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({ message: "Invalid Otp" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password Is Required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();
    return res.status(201).json({ message: "Password Changed Successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message, stack: error.stack });
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
