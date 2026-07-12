const express = require("express");

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const router = express.Router();

router.get("/", verifyJWT, getCategories);

router.get("/:id", verifyJWT, getCategoryById);

router.post(
  "/",
  verifyJWT,
  verifyRole("Admin"),
  createCategory
);

router.put(
  "/:id",
  verifyJWT,
  verifyRole("Admin"),
  updateCategory
);

router.delete(
  "/:id",
  verifyJWT,
  verifyRole("Admin"),
  deleteCategory
);

module.exports = router;