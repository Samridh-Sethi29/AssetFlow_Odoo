const bcrypt = require("bcryptjs");
const User = require("../models/User");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

// GET ALL (with optional department/role filter)
const getUsers = async (req, res) => {
    try {
        const query = {};

        if (req.query.department) query.department = req.query.department;
        if (req.query.role) query.role = req.query.role;
        if (req.query.status) query.status = req.query.status;

        const users = await User.find(query)
            .populate("department", "departmentName")
            .sort({ createdAt: -1 });

        return successResponse(res, "Users fetched successfully.", users);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET ONE
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate(
            "department",
            "departmentName"
        );

        if (!user) {
            return errorResponse(res, "User not found.", 404);
        }

        return successResponse(res, "User fetched successfully.", user);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// CREATE (Admin creates a user directly, e.g. for staff onboarding)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, department, phone } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!name?.trim() || !normalizedEmail || !password) {
            return errorResponse(
                res,
                "Name, email and password are required.",
                400
            );
        }

        if (password.length < 6) {
            return errorResponse(res, "Password must be at least 6 characters long.", 400);
        }

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return errorResponse(
                res,
                "User already exists with this email.",
                409
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: role || "Employee",
            department,
            phone,
        });

        const userData = user.toObject();
        delete userData.password;

        return successResponse(
            res,
            "User created successfully.",
            userData,
            201
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// UPDATE
const updateUser = async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;

        if (updates.password !== undefined) {
            if (typeof updates.password !== "string" || updates.password.length < 6) {
                return errorResponse(res, "Password must be at least 6 characters long.", 400);
            }
            updates.password = await bcrypt.hash(updates.password, 10);
        }

        if (updates.email) updates.email = updates.email.trim().toLowerCase();

        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!user) {
            return errorResponse(res, "User not found.", 404);
        }

        return successResponse(res, "User updated successfully.", user);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// DELETE (soft delete -> Inactive)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status: "Inactive" },
            { new: true }
        ).select("-password");

        if (!user) {
            return errorResponse(res, "User not found.", 404);
        }

        return successResponse(res, "User deactivated successfully.", user);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
};
