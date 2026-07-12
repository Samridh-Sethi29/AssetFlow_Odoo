const Maintenance = require("../models/Maintenance");
const Asset = require("../models/Asset");
const Vendor = require("../models/Vendor");
const User = require("../models/User");
const { logActivity } = require("../services/activity.service");
const { successResponse, errorResponse } = require("../utils/response");

const createMaintenance = async (req, res) => {
  try {
    const { asset, issue, description, priority, assignedVendor, estimatedCost } = req.body;

    if (!asset || !issue?.trim()) {
      return errorResponse(res, "Asset and issue are required.", 400);
    }

    const existingAsset = await Asset.findById(asset);
    if (!existingAsset) {
      return errorResponse(res, "Asset not found.", 404);
    }

    if (["Disposed", "Lost", "Retired"].includes(existingAsset.status)) {
      return errorResponse(res, "This asset cannot be sent for maintenance.", 400);
    }

    if (assignedVendor && !(await Vendor.exists({ _id: assignedVendor }))) {
      return errorResponse(res, "Assigned vendor not found.", 404);
    }

    const maintenance = await Maintenance.create({
      asset,
      issue,
      description: description || "",
      reportedBy: req.user.id,
      priority,
      assignedVendor: assignedVendor || null,
      estimatedCost: estimatedCost || 0,
      status: "Pending",
    });

    existingAsset.history.push({
      action: "MAINTENANCE",
      performedBy: req.user.id,
      description: `Maintenance request raised: "${issue}".`,
    });
    await existingAsset.save();

    await logActivity({
      userId: req.user.id,
      module: "Maintenance",
      action: "CREATE",
      description: `Raised maintenance request for ${existingAsset.assetTag}.`,
      req,
    });

    return successResponse(res, "Maintenance request created successfully.", maintenance, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const getMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.find()
      .populate("asset")
      .populate("reportedBy", "name email")
      .populate("assignedVendor", "vendorName")
      .populate("assignedTechnician", "name email")
      .sort({ createdAt: -1 });

    return successResponse(res, "Maintenance records fetched successfully.", maintenance);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedVendor, assignedTechnician, estimatedCost, actualCost, issue, description } = req.body;

    const maintenance = await Maintenance.findById(id);
    if (!maintenance) {
      return errorResponse(res, "Maintenance request not found.", 404);
    }

    if (maintenance.status === "Completed") {
      return errorResponse(res, "Completed maintenance cannot be modified.", 400);
    }

    const asset = await Asset.findById(maintenance.asset);
    if (!asset) {
      return errorResponse(res, "Associated asset not found.", 404);
    }

    // Handle State Machine transitions
    if (status && status !== maintenance.status) {
      if (status === "Approved") {
        asset.status = "Maintenance"; // Under Maintenance
        asset.history.push({
          action: "STATUS_CHANGED",
          performedBy: req.user.id,
          description: "Maintenance request approved. Asset set to Under Maintenance.",
        });
        await asset.save();
      } else if (status === "Rejected") {
        asset.history.push({
          action: "STATUS_CHANGED",
          performedBy: req.user.id,
          description: "Maintenance request rejected.",
        });
        await asset.save();
      } else if (status === "In Progress" && maintenance.status === "Approved") {
        maintenance.startDate = new Date();
      } else if (status === "Completed") {
        maintenance.status = "Completed";
        maintenance.completedDate = new Date();
        maintenance.actualCost = actualCost !== undefined ? actualCost : maintenance.estimatedCost;

        asset.status = "Available"; // Back to Available
        asset.history.push({
          action: "STATUS_CHANGED",
          performedBy: req.user.id,
          description: "Maintenance completed. Asset set to Available.",
        });
        await asset.save();

        await logActivity({
          userId: req.user.id,
          module: "Maintenance",
          action: "COMPLETE",
          description: `Completed maintenance for ${asset.assetTag}.`,
          req,
        });
      }
      maintenance.status = status;
    }

    // Update other fields
    if (priority) maintenance.priority = priority;
    if (estimatedCost !== undefined) maintenance.estimatedCost = estimatedCost;
    if (actualCost !== undefined) maintenance.actualCost = actualCost;
    if (issue) maintenance.issue = issue;
    if (description !== undefined) maintenance.description = description;

    if (assignedVendor !== undefined) {
      if (assignedVendor && !(await Vendor.exists({ _id: assignedVendor }))) {
        return errorResponse(res, "Assigned vendor not found.", 404);
      }
      maintenance.assignedVendor = assignedVendor || null;
    }

    if (assignedTechnician !== undefined) {
      if (assignedTechnician && !(await User.exists({ _id: assignedTechnician }))) {
        return errorResponse(res, "Assigned technician not found.", 404);
      }
      maintenance.assignedTechnician = assignedTechnician || null;
    }

    await maintenance.save();

    return successResponse(res, "Maintenance updated successfully.", maintenance);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const completeMaintenance = async (req, res) => {
  // Delegate to updateMaintenance logic for completion
  req.body.status = "Completed";
  return updateMaintenance(req, res);
};

const deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return errorResponse(res, "Maintenance request not found.", 404);
    }

    if (maintenance.status !== "Completed" && maintenance.status !== "Rejected") {
      const asset = await Asset.findById(maintenance.asset);
      if (asset && asset.status === "Maintenance") {
        asset.status = "Available";
        asset.history.push({
          action: "STATUS_CHANGED",
          performedBy: req.user.id,
          description: "Maintenance request cancelled. Asset reverted to Available.",
        });
        await asset.save();
      }
    }

    return successResponse(res, "Maintenance deleted successfully.");
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  createMaintenance,
  getMaintenance,
  updateMaintenance,
  completeMaintenance,
  deleteMaintenance,
};
