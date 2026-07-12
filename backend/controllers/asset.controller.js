const Asset = require("../models/Asset");
const Allocation = require("../models/Allocation");
const Maintenance = require("../models/Maintenance");
const Booking = require("../models/Booking");
const { logActivity } = require("../services/activity.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

const uploadedFiles = (req, field) =>
    (req.files?.[field] || []).map((file) => `/uploads/${field}/${file.filename}`);

const createAsset = async (req, res) => {
    try {
        if (typeof req.body.customValues === "string") {
            try {
                req.body.customValues = JSON.parse(req.body.customValues);
            } catch (err) {
                req.body.customValues = {};
            }
        }

        const {
            assetTag,
            assetName,
            category,
            vendor,
            department,
            purchaseDate,
            purchasePrice,
            warrantyStart,
            warrantyEnd,
            brand,
            model,
            serialNumber,
            location,
            remarks,
            customValues,
        } = req.body;

        if (!assetTag || !assetName || !category) {
            return errorResponse(
                res,
                "Asset Tag, Asset Name and Category are required.",
                400
            );
        }

        const duplicateChecks = [{ assetTag }];
        if (serialNumber) duplicateChecks.push({ serialNumber });

        const existingAsset = await Asset.findOne({ $or: duplicateChecks });

        if (existingAsset) {
            return errorResponse(
                res,
                "Asset already exists.",
                409
            );
        }

        const asset = await Asset.create({
            assetTag,
            assetName,
            category,
            vendor,
            department,
            purchaseDate,
            purchasePrice,
            warrantyStart,
            warrantyEnd,
            brand,
            model,
            serialNumber,
            location,
            remarks,
            customValues,
            images: uploadedFiles(req, "images"),
            documents: uploadedFiles(req, "documents"),
            createdBy: req.user.id,

            history: [
                {
                    action: "CREATED",
                    performedBy: req.user.id,
                    description: "Asset registered.",
                },
            ],
        });

        await logActivity({
            userId: req.user.id,
            module: "Asset",
            action: "CREATE",
            description: `Registered asset ${asset.assetTag} — ${asset.assetName}.`,
            req,
        });

        return successResponse(
            res,
            "Asset created successfully.",
            asset,
            201
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }
};

const getAssets = async (req, res) => {

    try {

        const assets = await Asset.find()
            .populate("category", "name")
            .populate("department", "departmentName")
            .populate("vendor", "vendorName")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return successResponse(
            res,
            "Assets fetched successfully.",
            assets
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const getAssetById = async (req, res) => {

    try {

        const asset = await Asset.findById(req.params.id)
            .populate("category")
            .populate("department")
            .populate("vendor")
            .populate("createdBy", "name email");

        if (!asset) {
            return errorResponse(
                res,
                "Asset not found.",
                404
            );
        }

        return successResponse(
            res,
            "Asset fetched successfully.",
            asset
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const updateAsset = async (req, res) => {
    try {
        if (typeof req.body.customValues === "string") {
            try {
                req.body.customValues = JSON.parse(req.body.customValues);
            } catch (err) {
                req.body.customValues = {};
            }
        }

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return errorResponse(
                res,
                "Asset not found.",
                404
            );
        }

        const editableFields = [
            "assetTag", "assetName", "category", "vendor", "department",
            "purchaseDate", "purchasePrice", "warrantyStart", "warrantyEnd",
            "brand", "model", "serialNumber", "qrCode", "status", "condition",
            "location", "images", "documents", "remarks", "customValues",
        ];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => editableFields.includes(key))
        );

        const newImages = uploadedFiles(req, "images");
        const newDocuments = uploadedFiles(req, "documents");
        if (newImages.length) updates.images = [...asset.images, ...newImages];
        if (newDocuments.length) updates.documents = [...asset.documents, ...newDocuments];

        if (updates.assetTag || updates.serialNumber) {
            const duplicates = [];
            if (updates.assetTag && updates.assetTag !== asset.assetTag) duplicates.push({ assetTag: updates.assetTag });
            if (updates.serialNumber && updates.serialNumber !== asset.serialNumber) duplicates.push({ serialNumber: updates.serialNumber });
            if (duplicates.length && await Asset.exists({ _id: { $ne: asset._id }, $or: duplicates })) {
                return errorResponse(res, "Another asset already uses that tag or serial number.", 409);
            }
        }

        Object.assign(asset, updates);

        asset.history.push({
            action: "UPDATED",
            performedBy: req.user.id,
            description: "Asset details updated.",
        });

        await asset.save();

        return successResponse(
            res,
            "Asset updated successfully.",
            asset
        );

    } catch (error) {
        return errorResponse(res, error.message);
    }
};

const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return errorResponse(
                res,
                "Asset not found.",
                404
            );
        }

        const [activeAllocation, openMaintenance, futureBooking] = await Promise.all([
            Allocation.exists({ asset: asset._id, allocationStatus: "Allocated" }),
            Maintenance.exists({ asset: asset._id, status: { $in: ["Pending", "In Progress"] } }),
            Booking.exists({ asset: asset._id, status: "Approved", endTime: { $gt: new Date() } }),
        ]);
        if (activeAllocation || openMaintenance || futureBooking) {
            return errorResponse(res, "This asset has active work and cannot be deleted.", 409);
        }

        // Check if there is any history at all (allocations, bookings, maintenance logs)
        const [hasAllocations, hasMaintenance, hasBookings] = await Promise.all([
            Allocation.exists({ asset: asset._id }),
            Maintenance.exists({ asset: asset._id }),
            Booking.exists({ asset: asset._id }),
        ]);

        // If it was registered by mistake and has zero activity history, delete permanently
        if (!hasAllocations && !hasMaintenance && !hasBookings) {
            await Asset.findByIdAndDelete(req.params.id);
            await logActivity({
                userId: req.user.id,
                module: "Asset",
                action: "DELETE",
                description: `Permanently deleted asset ${asset.assetTag} (created by mistake).`,
                req,
            });
            return successResponse(res, "Asset deleted permanently.");
        }

        // Otherwise, soft-delete by setting status to Disposed to preserve historical logs
        asset.status = "Disposed";
        asset.history.push({
            action: "DELETED",
            performedBy: req.user.id,
            description: "Asset marked as disposed.",
        });

        await asset.save();

        await logActivity({
            userId: req.user.id,
            module: "Asset",
            action: "DELETE",
            description: `Marked asset ${asset.assetTag} as Disposed.`,
            req,
        });

        return successResponse(
            res,
            "Asset marked as disposed successfully."
        );

    } catch (error) {
        return errorResponse(res, error.message);
    }
};

const searchAssets = async (req, res) => {

    try {

        const { search } = req.query;

        const assets = await Asset.find({
            $or: [
                {
                    assetTag: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    assetName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    serialNumber: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ],
        });

        return successResponse(
            res,
            "Assets fetched successfully.",
            assets
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }

};

const filterAssets = async (req, res) => {

    try {

        const query = {};

        if (req.query.status)
            query.status = req.query.status;

        if (req.query.category)
            query.category = req.query.category;

        if (req.query.department)
            query.department = req.query.department;

        if (req.query.condition)
            query.condition = req.query.condition;

        const assets = await Asset.find(query)
            .populate("category", "name")
            .populate("department", "departmentName");

        return successResponse(
            res,
            "Assets fetched successfully.",
            assets
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }

};

const getAssetHistory = async (req, res) => {

    try {

        const asset = await Asset.findById(req.params.id)
            .populate(
                "history.performedBy",
                "name email"
            );

        if (!asset) {
            return errorResponse(
                res,
                "Asset not found.",
                404
            );
        }

        return successResponse(
            res,
            "Asset history fetched successfully.",
            asset.history
        );

    } catch (error) {

        return errorResponse(res, error.message);

    }

};

module.exports = {
    createAsset,
    getAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    searchAssets,
    filterAssets,
    getAssetHistory,
};
