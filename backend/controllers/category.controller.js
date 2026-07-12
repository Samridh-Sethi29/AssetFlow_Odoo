const Category = require("../models/Category");
const Asset = require("../models/Asset");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

// GET ALL
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    return successResponse(
      res,
      "Categories fetched successfully",
      categories
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// GET ONE
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    return successResponse(
      res,
      "Category fetched successfully",
      category
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// CREATE
const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name?.trim()) {
      return errorResponse(res, "Category name is required", 400);
    }

    const exists = await Category.findOne({ name });

    if (exists) {
      return errorResponse(
        res,
        "Category already exists",
        409
      );
    }

    const category = await Category.create({
      name,
      description,
      icon,
    });

    return successResponse(
      res,
      "Category created successfully",
      category,
      201
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// UPDATE
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    return successResponse(
      res,
      "Category updated successfully",
      category
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

// DELETE
const deleteCategory = async (req, res) => {
  try {
    const inUse = await Asset.exists({ category: req.params.id });
    if (inUse) {
      return errorResponse(res, "This category is assigned to assets and cannot be deleted.", 409);
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return errorResponse(res, "Category not found", 404);
    }

    return successResponse(
      res,
      "Category deleted successfully"
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
