const Allocation = require("../models/Allocation");
const Asset = require("../models/Asset");
const User = require("../models/User");
const { logActivity } = require("../services/activity.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

const allocateAsset = async (req, res) => {

    try {

        const {
            asset,
            employee,
            expectedReturnDate,
            remarks,
        } = req.body;

        if (!asset || !employee) {
            return errorResponse(res, "Asset and employee are required.", 400);
        }

        if (expectedReturnDate && Number.isNaN(new Date(expectedReturnDate).getTime())) {
            return errorResponse(res, "Expected return date is invalid.", 400);
        }

        const existingAsset = await Asset.findById(asset);

        const employeeDoc = await User.findOne({
            _id: employee,
            status: "Active",
        });

                if (!existingAsset) {
                    return errorResponse(
                        res,
                        "Asset not found.",
                        404
                    );
                }

                if (!employeeDoc) {
                    return errorResponse(
                        res,
                        "Active employee not found.",
                        404
                    );
                }

                if (existingAsset.status !== "Available") {
                    return errorResponse(
                        res,
                        "Asset is not available for allocation.",
                        400
                    );
                }

        const existingAllocation = await Allocation.findOne({
            asset,
            allocationStatus: "Allocated",
        });

        if (existingAllocation) {
            return errorResponse(
                res,
                "Asset is already allocated.",
                400
            );
        }

        const allocation = await Allocation.create({

            asset,

            employee,

            allocatedBy: req.user.id,

            expectedReturnDate,

            remarks,

        });

        existingAsset.status = "Allocated";

        existingAsset.history.push({
            action: "ALLOCATED",
            performedBy: req.user.id,
            description: `Allocated to employee.`,
        });

        await existingAsset.save();

        await logActivity({
            userId: req.user.id,
            module: "Allocation",
            action: "ALLOCATE",
            description: `Allocated asset ${existingAsset.assetTag} to an employee.`,
            req,
        });

        return successResponse(
            res,
            "Asset allocated successfully.",
            allocation,
            201
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const returnAsset = async (req, res) => {
    try {

        const allocation = await Allocation.findById(req.params.id);

        if (!allocation) {
            return errorResponse(
                res,
                "Allocation not found.",
                404
            );
        }

        if (allocation.allocationStatus !== "Allocated") {
            return errorResponse(
                res,
                "Only active allocations can be returned.",
                400
            );
        }

        const asset = await Asset.findById(allocation.asset);

        if (!asset) {
            return errorResponse(res, "Associated asset not found.", 404);
        }

        allocation.returnedDate = new Date();
        allocation.allocationStatus = "Returned";

        allocation.assetConditionAtReturn =
            req.body.assetConditionAtReturn;

        await allocation.save();

        asset.status = "Available";

        asset.history.push({
            action: "RETURNED",
            performedBy: req.user.id,
            description: "Asset returned by employee.",
        });

        await asset.save();

        await logActivity({
            userId: req.user.id,
            module: "Allocation",
            action: "RETURN",
            description: `Asset ${asset.assetTag} returned.`,
            req,
        });

        return successResponse(
            res,
            "Asset returned successfully.",
            allocation
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }
};

const getAllocations = async (req, res) => {

    try {

        const canViewAll = ["Admin", "Asset Manager"].includes(req.user.role);
        const allocations = await Allocation.find(canViewAll ? {} : { employee: req.user.id })
            .populate("asset")
            .populate("employee", "name email")
            .populate("allocatedBy", "name");

        return successResponse(
            res,
            "Allocations fetched successfully.",
            allocations
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const getEmployeeAllocations = async (req, res) => {

    try {

        const canViewAll = ["Admin", "Asset Manager"].includes(req.user.role);
        if (!canViewAll && req.params.employeeId !== req.user.id) {
            return errorResponse(res, "You can only view your own allocations.", 403);
        }

        const allocations = await Allocation.find({
            employee: req.params.employeeId,
        })
            .populate("asset");

        return successResponse(
            res,
            "Employee allocations fetched successfully.",
            allocations
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const getAllocationHistory = async (req, res) => {

    try {

        const canViewAll = ["Admin", "Asset Manager"].includes(req.user.role);
        const history = await Allocation.find(canViewAll ? {} : { employee: req.user.id })
            .populate("asset", "assetName assetTag")
            .populate("employee", "name")
            .populate("allocatedBy", "name")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            "Allocation history fetched successfully.",
            history
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

module.exports = {
    allocateAsset,
    returnAsset,
    getAllocations,
    getEmployeeAllocations,
    getAllocationHistory,
};
