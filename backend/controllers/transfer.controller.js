const Transfer = require("../models/Transfer");
const Asset = require("../models/Asset");
const Allocation = require("../models/Allocation");
const User = require("../models/User");
const { logActivity } = require("../services/activity.service");
const { successResponse, errorResponse } = require("../utils/response");

const createTransfer = async (req, res) => {
  try {
    const { asset, toEmployee, remarks } = req.body;

    if (!asset || !toEmployee) {
      return errorResponse(res, "Asset and target employee are required.", 400);
    }

    const assetDoc = await Asset.findById(asset);
    if (!assetDoc) {
      return errorResponse(res, "Asset not found.", 404);
    }

    // Find the current active allocation to get the fromEmployee
    const activeAllocation = await Allocation.findOne({
      asset,
      allocationStatus: "Allocated",
    }).populate("employee");

    if (!activeAllocation) {
      return errorResponse(res, "Asset is not currently allocated to anyone.", 400);
    }

    const fromEmployee = activeAllocation.employee._id;

    if (fromEmployee.toString() === toEmployee.toString()) {
      return errorResponse(res, "Cannot transfer an asset to its current holder.", 400);
    }

    const targetUser = await User.findById(toEmployee);
    if (!targetUser || targetUser.status !== "Active") {
      return errorResponse(res, "Target employee is not active or does not exist.", 400);
    }

    const transfer = await Transfer.create({
      asset,
      fromEmployee,
      toEmployee,
      requestedBy: req.user.id,
      remarks,
    });

    await logActivity({
      userId: req.user.id,
      module: "Allocation",
      action: "UPDATE",
      description: `Requested transfer for ${assetDoc.assetTag} to ${targetUser.name}.`,
      req,
    });

    return successResponse(res, "Transfer request submitted successfully.", transfer, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const getTransfers = async (req, res) => {
  try {
    const isManager = ["Admin", "Asset Manager", "Department Head"].includes(req.user.role);
    const query = isManager
      ? {}
      : {
          $or: [
            { fromEmployee: req.user.id },
            { toEmployee: req.user.id },
            { requestedBy: req.user.id },
          ],
        };

    const transfers = await Transfer.find(query)
      .populate("asset", "assetName assetTag")
      .populate("fromEmployee", "name email")
      .populate("toEmployee", "name email")
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 });

    return successResponse(res, "Transfers fetched successfully.", transfers);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const approveTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate("asset")
      .populate("fromEmployee")
      .populate("toEmployee");

    if (!transfer) {
      return errorResponse(res, "Transfer request not found.", 404);
    }

    if (transfer.status !== "Pending") {
      return errorResponse(res, "Only pending transfers can be approved.", 400);
    }

    // 1. Return the current allocation
    const currentAllocation = await Allocation.findOne({
      asset: transfer.asset._id,
      employee: transfer.fromEmployee._id,
      allocationStatus: "Allocated",
    });

    if (currentAllocation) {
      currentAllocation.returnedDate = new Date();
      currentAllocation.allocationStatus = "Returned";
      currentAllocation.assetConditionAtReturn = "Good";
      await currentAllocation.save();
    }

    // 2. Create the new allocation
    const newAllocation = await Allocation.create({
      asset: transfer.asset._id,
      employee: transfer.toEmployee._id,
      allocatedBy: req.user.id,
      remarks: `Transferred from ${transfer.fromEmployee.name}. ${transfer.remarks || ""}`,
    });

    // 3. Update the transfer record
    transfer.status = "Approved";
    await transfer.save();

    // 4. Update the Asset's timeline / log history
    const asset = transfer.asset;
    asset.history.push({
      action: "TRANSFERRED",
      performedBy: req.user.id,
      description: `Transferred from ${transfer.fromEmployee.name} to ${transfer.toEmployee.name}.`,
    });
    await asset.save();

    await logActivity({
      userId: req.user.id,
      module: "Allocation",
      action: "ALLOCATE",
      description: `Approved transfer of ${asset.assetTag} to ${transfer.toEmployee.name}.`,
      req,
    });

    return successResponse(res, "Transfer approved and asset re-allocated.", { transfer, newAllocation });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const rejectTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);

    if (!transfer) {
      return errorResponse(res, "Transfer request not found.", 404);
    }

    if (transfer.status !== "Pending") {
      return errorResponse(res, "Only pending transfers can be rejected.", 400);
    }

    transfer.status = "Rejected";
    await transfer.save();

    await logActivity({
      userId: req.user.id,
      module: "Allocation",
      action: "UPDATE",
      description: `Rejected transfer request for asset.`,
      req,
    });

    return successResponse(res, "Transfer request rejected.", transfer);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  createTransfer,
  getTransfers,
  approveTransfer,
  rejectTransfer,
};
