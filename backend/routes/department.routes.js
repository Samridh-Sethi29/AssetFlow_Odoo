const express = require("express");

const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/department.controller");

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const router = express.Router();

router.get("/", verifyJWT, getDepartments);

router.get("/:id", verifyJWT, getDepartmentById);

router.post(
  "/",
  verifyJWT,
  verifyRole("Admin"),
  createDepartment
);

router.put(
  "/:id",
  verifyJWT,
  verifyRole("Admin"),
  updateDepartment
);

router.delete(
  "/:id",
  verifyJWT,
  verifyRole("Admin"),
  deleteDepartment
);

module.exports = router;