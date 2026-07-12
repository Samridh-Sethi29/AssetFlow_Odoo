const express = require("express");

const router = express.Router();

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const {
    allocateAsset,
    returnAsset,
    getAllocations,
    getEmployeeAllocations,
    getAllocationHistory,
} = require("../controllers/allocation.controller");

router.post(
    "/",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    allocateAsset
);

router.put(
    "/return/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    returnAsset
);

router.get(
    "/",
    verifyJWT,
    getAllocations
);

router.get(
    "/history",
    verifyJWT,
    getAllocationHistory
);

router.get(
    "/employee/:employeeId",
    verifyJWT,
    getEmployeeAllocations
);

module.exports = router;