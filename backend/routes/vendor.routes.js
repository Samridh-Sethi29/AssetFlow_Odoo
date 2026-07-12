const express = require("express");

const {
    getVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor,
} = require("../controllers/vendor.controller");

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const router = express.Router();

router.get("/", verifyJWT, getVendors);

router.get("/:id", verifyJWT, getVendorById);

router.post(
    "/",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    createVendor
);

router.put(
    "/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    updateVendor
);

router.delete(
    "/:id",
    verifyJWT,
    verifyRole("Admin"),
    deleteVendor
);

module.exports = router;
