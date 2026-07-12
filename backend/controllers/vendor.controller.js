const Vendor = require("../models/Vendor");
const Asset = require("../models/Asset");
const Maintenance = require("../models/Maintenance");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

// GET ALL
const getVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ createdAt: -1 });

        return successResponse(
            res,
            "Vendors fetched successfully.",
            vendors
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET ONE
const getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);

        if (!vendor) {
            return errorResponse(res, "Vendor not found.", 404);
        }

        return successResponse(
            res,
            "Vendor fetched successfully.",
            vendor
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// CREATE
const createVendor = async (req, res) => {
    try {
        const {
            vendorName,
            contactPerson,
            email,
            phone,
            address,
            website,
        } = req.body;

        if (!vendorName) {
            return errorResponse(res, "Vendor name is required.", 400);
        }

        const vendor = await Vendor.create({
            vendorName,
            contactPerson,
            email,
            phone,
            address,
            website,
        });

        return successResponse(
            res,
            "Vendor created successfully.",
            vendor,
            201
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// UPDATE
const updateVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!vendor) {
            return errorResponse(res, "Vendor not found.", 404);
        }

        return successResponse(
            res,
            "Vendor updated successfully.",
            vendor
        );
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// DELETE
const deleteVendor = async (req, res) => {
  try {
    const [usedByAsset, usedByMaintenance] = await Promise.all([
      Asset.exists({ vendor: req.params.id }),
      Maintenance.exists({ assignedVendor: req.params.id }),
    ]);
    if (usedByAsset || usedByMaintenance) {
      return errorResponse(res, "This vendor is in use and cannot be deleted.", 409);
    }

        const vendor = await Vendor.findByIdAndDelete(req.params.id);

        if (!vendor) {
            return errorResponse(res, "Vendor not found.", 404);
        }

        return successResponse(res, "Vendor deleted successfully.");
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

module.exports = {
    getVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor,
};
