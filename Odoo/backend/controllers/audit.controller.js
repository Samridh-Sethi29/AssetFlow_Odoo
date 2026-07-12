const Audit = require("../models/Audit");
const Asset = require("../models/Asset");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

// GET ALL
const getAudits = async (req, res) => {
    try {
        const query = {};
        if (req.query.result) query.result = req.query.result;
        if (req.query.asset) query.asset = req.query.asset;

        const audits = await Audit.find(query)
            .populate("asset", "assetTag assetName")
            .populate("auditor", "name email")
            .sort({ createdAt: -1 });

        return successResponse(res, "Audits fetched successfully.", audits);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET ONE
const getAuditById = async (req, res) => {
    try {
        const audit = await Audit.findById(req.params.id)
            .populate("asset", "assetTag assetName")
            .populate("auditor", "name email");

        if (!audit) {
            return errorResponse(res, "Audit not found.", 404);
        }

        return successResponse(res, "Audit fetched successfully.", audit);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// CREATE
const createAudit = async (req, res) => {
    try {
        const {
            asset,
            auditDate,
            expectedLocation,
            actualLocation,
            result,
            remarks,
        } = req.body;

        if (!asset || !result) {
            return errorResponse(
                res,
                "Asset and result are required.",
                400
            );
        }

        const assetDoc = await Asset.findById(asset);

        if (!assetDoc) {
            return errorResponse(res, "Asset not found.", 404);
        }

        const audit = await Audit.create({
            asset,
            auditor: req.user.id,
            auditDate,
            expectedLocation,
            actualLocation,
            result,
            remarks,
        });

        // Reflect audit outcome onto the asset's condition/status + history
        if (result === "Missing") {
            assetDoc.status = "Lost";
        } else if (result === "Damaged") {
            assetDoc.condition = "Damaged";
        }

        assetDoc.history.push({
            action: "AUDITED",
            performedBy: req.user.id,
            description: `Audit result: ${result}.`,
        });

        await assetDoc.save();

        return successResponse(
            res,
            "Audit recorded successfully.",
            audit,
            201
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// UPDATE
const updateAudit = async (req, res) => {
    try {
        const editableFields = ["auditDate", "expectedLocation", "actualLocation", "remarks"];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => editableFields.includes(key))
        );
        const audit = await Audit.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!audit) {
            return errorResponse(res, "Audit not found.", 404);
        }

        return successResponse(res, "Audit updated successfully.", audit);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// DELETE
const deleteAudit = async (req, res) => {
    try {
        const audit = await Audit.findByIdAndDelete(req.params.id);

        if (!audit) {
            return errorResponse(res, "Audit not found.", 404);
        }

        return successResponse(res, "Audit deleted successfully.");
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

module.exports = {
    getAudits,
    getAuditById,
    createAudit,
    updateAudit,
    deleteAudit,
};
