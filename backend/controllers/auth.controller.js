const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { logActivity } = require("../services/activity.service");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail || !password) {
      return errorResponse(
        res,
        "Name, email and password are required",
        400
      );
    }

    if (password.length < 6) {
      return errorResponse(res, "Password must be at least 6 characters long", 400);
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return errorResponse(
        res,
        "User already exists with this email",
        409
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: "Employee",
      status: "Active",
    });

    const userData = user.toObject();
    delete userData.password;

    return successResponse(
      res,
      "Account created successfully",
      userData,
      201
    );

  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return errorResponse(
        res,
        "Email and password are required",
        400
      );
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return errorResponse(
        res,
        "Invalid email or password",
        401
      );
    }

    if (user.status !== "Active") {
      return errorResponse(res, "This account is inactive. Contact an administrator.", 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return errorResponse(
        res,
        "Invalid email or password",
        401
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    user.password = undefined;

    await logActivity({
      userId: user._id,
      module: "Auth",
      action: "LOGIN",
      description: `${user.name} logged in.`,
      req,
    });

    return successResponse(res, "Login successful", {
      token,
      user,
    });

  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const logout = async (req, res) => {
  return successResponse(res, "Logged out successfully");
};

const me = async (req, res) => {
  try {

    const user = await User.findById(req.user.id)
      .populate("department")
      .select("-password");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, "User fetched successfully", user);

  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
};
