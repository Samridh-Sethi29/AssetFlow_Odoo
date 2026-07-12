const Asset = require("../models/Asset");
const Allocation = require("../models/Allocation");
const Booking = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Audit = require("../models/Audit");
const Activity = require("../models/Activity");
const Department = require("../models/Department");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

// GET /api/dashboard/stats
const getStats = async (req, res) => {
    try {
        const [
            totalAssets,
            availableAssets,
            allocatedAssets,
            maintenanceAssets,
            disposedAssets,
            activeAllocations,
            overdueAllocations,
            pendingBookings,
            openMaintenance,
            totalDepartments,
        ] = await Promise.all([
            Asset.countDocuments(),
            Asset.countDocuments({ status: "Available" }),
            Asset.countDocuments({ status: "Allocated" }),
            Asset.countDocuments({ status: "Maintenance" }),
            Asset.countDocuments({ status: "Disposed" }),
            Allocation.countDocuments({ allocationStatus: "Allocated" }),
            Allocation.countDocuments({ allocationStatus: "Overdue" }),
            Booking.countDocuments({ status: "Pending" }),
            Maintenance.countDocuments({
                status: { $in: ["Pending", "In Progress"] },
            }),
            Department.countDocuments({ status: "Active" }),
        ]);

        return successResponse(res, "Dashboard stats fetched successfully.", {
            totalAssets,
            availableAssets,
            allocatedAssets,
            maintenanceAssets,
            disposedAssets,
            activeAllocations,
            overdueAllocations,
            pendingBookings,
            openMaintenance,
            totalDepartments,
        });
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET /api/dashboard/recent-assets
const getRecentAssets = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 5;

        const assets = await Asset.find()
            .populate("category", "name")
            .populate("department", "departmentName")
            .sort({ createdAt: -1 })
            .limit(limit);

        return successResponse(
            res,
            "Recent assets fetched successfully.",
            assets
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET /api/dashboard/activity
const getActivityFeed = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10;

        const activity = await Activity.find()
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .limit(limit);

        return successResponse(
            res,
            "Recent activity fetched successfully.",
            activity
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET /api/dashboard/charts
const getCharts = async (req, res) => {
    try {
        const [byStatus, byCategory, maintenanceByPriority] =
            await Promise.all([
                Asset.aggregate([
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                ]),
                Asset.aggregate([
                    {
                        $group: {
                            _id: "$category",
                            count: { $sum: 1 },
                        },
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "_id",
                            foreignField: "_id",
                            as: "category",
                        },
                    },
                ]),
                Maintenance.aggregate([
                    {
                        $group: {
                            _id: "$priority",
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);

        return successResponse(res, "Chart data fetched successfully.", {
            assetsByStatus: byStatus.map((s) => ({
                label: s._id,
                value: s.count,
            })),
            assetsByCategory: byCategory.map((c) => ({
                label: c.category[0]?.name || "Uncategorized",
                value: c.count,
            })),
            maintenanceByPriority: maintenanceByPriority.map((m) => ({
                label: m._id,
                value: m.count,
            })),
        });
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

module.exports = {
    getStats,
    getRecentAssets,
    getActivityFeed,
    getCharts,
};
