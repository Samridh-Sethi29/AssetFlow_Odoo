const Maintenance = require("../models/Maintenance");
const Asset = require("../models/Asset");
const Vendor = require("../models/Vendor");
const { logActivity } = require("../services/activity.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

const createMaintenance = async (req, res) => {

    try {

        const {
            asset,
            issue,
            description,
            priority,
            assignedVendor,
            estimatedCost,
        } = req.body;

        if (!asset || !issue?.trim()) {
            return errorResponse(res, "Asset and issue are required.", 400);
        }

        const existingAsset = await Asset.findById(asset);

        if (!existingAsset) {
            return errorResponse(
                res,
                "Asset not found.",
                404
            );
        }

        if (["Disposed", "Lost", "Retired", "Maintenance"].includes(existingAsset.status)) {
            return errorResponse(res, "This asset cannot be sent for maintenance.", 400);
        }

        if (assignedVendor && !await Vendor.exists({ _id: assignedVendor })) {
            return errorResponse(res, "Assigned vendor not found.", 404);
        }

        const maintenance = await Maintenance.create({

            asset,

            issue,

            description,

            reportedBy: req.user.id,

            priority,

            assignedVendor,

            estimatedCost,

        });

        existingAsset.status = "Maintenance";

        existingAsset.history.push({

            action: "MAINTENANCE",

            performedBy: req.user.id,

            description: "Maintenance request raised.",

        });

        await existingAsset.save();

        await logActivity({
            userId: req.user.id,
            module: "Maintenance",
            action: "CREATE",
            description: `Raised maintenance request for ${existingAsset.assetTag}.`,
            req,
        });

        return successResponse(
            res,
            "Maintenance request created successfully.",
            maintenance,
            201
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const getMaintenance = async (req, res) => {

    try {

        const maintenance = await Maintenance.find()

            .populate("asset")

            .populate("reportedBy", "name email")

            .populate("assignedVendor", "vendorName")

            .sort({ createdAt: -1 });

        return successResponse(
            res,
            "Maintenance records fetched successfully.",
            maintenance
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const updateMaintenance = async (req, res) => {

    try {

        const editableFields = ["issue", "description", "priority", "assignedVendor", "estimatedCost", "actualCost", "startDate"];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => editableFields.includes(key))
        );
        if (updates.assignedVendor && !await Vendor.exists({ _id: updates.assignedVendor })) {
            return errorResponse(res, "Assigned vendor not found.", 404);
        }

        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {

            return errorResponse(
                res,
                "Maintenance request not found.",
                404
            );

        }

        if (maintenance.status === "Completed") {
            return errorResponse(res, "Completed maintenance cannot be modified.", 400);
        }

        Object.assign(maintenance, updates);
        await maintenance.save();

        return successResponse(
            res,
            "Maintenance updated successfully.",
            maintenance
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const completeMaintenance = async (req, res) => {

    try {

        const maintenance = await Maintenance.findById(req.params.id);

        if (!maintenance) {

            return errorResponse(
                res,
                "Maintenance request not found.",
                404
            );

        }

        if (maintenance.status === "Completed") {
            return errorResponse(res, "Maintenance is already completed.", 400);
        }

        maintenance.status = "Completed";

        if (req.body.actualCost !== undefined) maintenance.actualCost = req.body.actualCost;

        maintenance.completedDate = new Date();

        await maintenance.save();

        const asset = await Asset.findById(maintenance.asset);

        if (!asset) {
            return errorResponse(res, "Associated asset not found.", 404);
        }

        asset.status = "Available";

        asset.history.push({

            action: "STATUS_CHANGED",

            performedBy: req.user.id,

            description: "Maintenance completed.",

        });

        await asset.save();

        await logActivity({
            userId: req.user.id,
            module: "Maintenance",
            action: "COMPLETE",
            description: `Completed maintenance for ${asset.assetTag}.`,
            req,
        });

        return successResponse(
            res,
            "Maintenance completed successfully.",
            maintenance
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const deleteMaintenance = async (req, res) => {

    try {

        const maintenance = await Maintenance.findByIdAndDelete(
            req.params.id
        );

        if (!maintenance) {

            return errorResponse(
                res,
                "Maintenance request not found.",
                404
            );

        }

        // A cancelled open request should not leave the asset stuck in maintenance.
        if (maintenance.status !== "Completed") {
            const asset = await Asset.findById(maintenance.asset);
            if (asset && asset.status === "Maintenance") {
                asset.status = "Available";
                asset.history.push({
                    action: "STATUS_CHANGED",
                    performedBy: req.user.id,
                    description: "Maintenance request cancelled.",
                });
                await asset.save();
            }
        }

        return successResponse(
            res,
            "Maintenance deleted successfully."
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

module.exports = {

    createMaintenance,

    getMaintenance,

    updateMaintenance,

    completeMaintenance,

    deleteMaintenance,

};
