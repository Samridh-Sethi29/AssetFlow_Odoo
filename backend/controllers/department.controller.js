const Department = require("../models/Department");
const Asset = require("../models/Asset");
const User = require("../models/User");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

// GET ALL
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("manager", "name email")
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      "Departments fetched successfully",
      departments
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET ONE
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate("manager", "name email");

    if (!department) {
      return errorResponse(res, "Department not found", 404);
    }

    return successResponse(
      res,
      "Department fetched successfully",
      department
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// CREATE
const createDepartment = async (req, res) => {
  try {
    const {
      departmentName,
      departmentCode,
      manager,
      location,
    } = req.body;

    if (!departmentName?.trim() || !departmentCode?.trim()) {
      return errorResponse(res, "Department name and code are required", 400);
    }

    const exists = await Department.findOne({
      $or: [
        { departmentName },
        { departmentCode }
      ]
    });

    if (exists) {
      return errorResponse(
        res,
        "Department already exists",
        409
      );
    }

    const department = await Department.create({
      departmentName,
      departmentCode,
      manager,
      location,
    });

    return successResponse(
      res,
      "Department created successfully",
      department,
      201
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// UPDATE
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!department) {
      return errorResponse(res, "Department not found", 404);
    }

    return successResponse(
      res,
      "Department updated successfully",
      department
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE
const deleteDepartment = async (req, res) => {
  try {
    const [usedByAsset, usedByUser] = await Promise.all([
      Asset.exists({ department: req.params.id }),
      User.exists({ department: req.params.id }),
    ]);
    if (usedByAsset || usedByUser) {
      return errorResponse(res, "This department is in use and cannot be deleted.", 409);
    }

    const department = await Department.findByIdAndDelete(
      req.params.id
    );

    if (!department) {
      return errorResponse(res, "Department not found", 404);
    }

    return successResponse(
      res,
      "Department deleted successfully"
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
