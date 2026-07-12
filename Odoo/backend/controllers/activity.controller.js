const Activity = require("../models/Activity");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

// GET ALL (supports pagination via ?limit=&page=)
const getActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 50;
        const page = parseInt(req.query.page, 10) || 1;

        const canViewAll = ["Admin", "Asset Manager"].includes(req.user.role);
        const query = canViewAll ? {} : { user: req.user.id };
        const activities = await Activity.find(query)
            .populate("user", "name email role")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Activity.countDocuments(query);

        return successResponse(res, "Activity logs fetched successfully.", {
            activities,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET by user
const getActivityByUser = async (req, res) => {
    try {
        const canViewAll = ["Admin", "Asset Manager"].includes(req.user.role);
        if (!canViewAll && req.params.id !== req.user.id) {
            return errorResponse(res, "You can only view your own activity.", 403);
        }
        const activities = await Activity.find({ user: req.params.id })
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            "User activity fetched successfully.",
            activities
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET by module
const getActivityByModule = async (req, res) => {
    try {
        if (!["Admin", "Asset Manager"].includes(req.user.role)) {
            return errorResponse(res, "Access denied.", 403);
        }
        const activities = await Activity.find({
            module: req.params.module,
        })
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            "Module activity fetched successfully.",
            activities
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

module.exports = {
    getActivity,
    getActivityByUser,
    getActivityByModule,
};
