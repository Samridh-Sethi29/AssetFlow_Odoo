const AuditCycle = require("../models/AuditCycle");
const Asset = require("../models/Asset");
const { logActivity } = require("../services/activity.service");
const { successResponse, errorResponse } = require("../utils/response");

const createAuditCycle = async (req, res) => {
  try {
    const { title, scopeDepartment, scopeLocation, startDate, endDate, assignedAuditors } = req.body;

    if (!title || !startDate || !endDate) {
      return errorResponse(res, "Title, start date and end date are required.", 400);
    }

    // Build the query to find assets in scope
    const query = { status: { $nin: ["Disposed", "Retired"] } };
    if (scopeDepartment) {
      query.department = scopeDepartment;
    }
    if (scopeLocation) {
      query.location = { $regex: scopeLocation, $options: "i" };
    }

    const assets = await Asset.find(query);

    const initialResults = assets.map((a) => ({
      asset: a._id,
      status: "Pending",
      actualLocation: a.location || "",
      remarks: "",
    }));

    const auditCycle = await AuditCycle.create({
      title,
      scopeDepartment: scopeDepartment || null,
      scopeLocation: scopeLocation || "",
      startDate,
      endDate,
      assignedAuditors: assignedAuditors || [],
      results: initialResults,
    });

    await logActivity({
      userId: req.user.id,
      module: "Audit",
      action: "CREATE",
      description: `Created audit cycle "${title}" with ${assets.length} assets in scope.`,
      req,
    });

    return successResponse(res, "Audit cycle created successfully.", auditCycle, 201);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const getAuditCycles = async (req, res) => {
  try {
    const cycles = await AuditCycle.find()
      .populate("scopeDepartment", "departmentName")
      .populate("assignedAuditors", "name email")
      .populate("results.asset", "assetName assetTag location status condition")
      .sort({ createdAt: -1 });

    return successResponse(res, "Audit cycles fetched successfully.", cycles);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const updateAuditItem = async (req, res) => {
  try {
    const { id } = req.params; // cycle id
    const { assetId, status, actualLocation, remarks } = req.body;

    if (!assetId || !status) {
      return errorResponse(res, "Asset ID and audit status are required.", 400);
    }

    const cycle = await AuditCycle.findById(id);
    if (!cycle) {
      return errorResponse(res, "Audit cycle not found.", 404);
    }

    if (cycle.status === "Closed") {
      return errorResponse(res, "Cannot update audit details for a closed cycle.", 400);
    }

    // Find and update item in results
    const item = cycle.results.find((r) => r.asset.toString() === assetId);
    if (!item) {
      return errorResponse(res, "Asset not found in this audit cycle scope.", 404);
    }

    item.status = status;
    item.actualLocation = actualLocation || "";
    item.remarks = remarks || "";
    item.updatedAt = new Date();

    await cycle.save();

    return successResponse(res, "Audit item updated successfully.", cycle);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

const closeAuditCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const cycle = await AuditCycle.findById(id);

    if (!cycle) {
      return errorResponse(res, "Audit cycle not found.", 404);
    }

    if (cycle.status === "Closed") {
      return errorResponse(res, "Audit cycle is already closed.", 400);
    }

    // Update assets based on audit findings
    for (const item of cycle.results) {
      if (item.status === "Missing") {
        await Asset.findByIdAndUpdate(item.asset, {
          status: "Lost",
          $push: {
            history: {
              action: "AUDITED",
              performedBy: req.user.id,
              description: `Flagged as MISSING in audit cycle "${cycle.title}". Status set to Lost.`,
            },
          },
        });
      } else if (item.status === "Damaged") {
        await Asset.findByIdAndUpdate(item.asset, {
          condition: "Damaged",
          $push: {
            history: {
              action: "AUDITED",
              performedBy: req.user.id,
              description: `Flagged as DAMAGED in audit cycle "${cycle.title}". Condition set to Damaged.`,
            },
          },
        });
      } else if (item.status === "Verified") {
        await Asset.findByIdAndUpdate(item.asset, {
          location: item.actualLocation,
          $push: {
            history: {
              action: "AUDITED",
              performedBy: req.user.id,
              description: `Verified in audit cycle "${cycle.title}". Location updated to: ${item.actualLocation}.`,
            },
          },
        });
      }
    }

    cycle.status = "Closed";
    await cycle.save();

    await logActivity({
      userId: req.user.id,
      module: "Audit",
      action: "UPDATE",
      description: `Closed audit cycle "${cycle.title}" and locked findings.`,
      req,
    });

    return successResponse(res, "Audit cycle closed and assets updated.", cycle);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  createAuditCycle,
  getAuditCycles,
  updateAuditItem,
  closeAuditCycle,
};
