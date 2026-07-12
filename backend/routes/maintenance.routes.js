const express = require("express");

const router = express.Router();

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const {

    createMaintenance,

    getMaintenance,

    updateMaintenance,

    completeMaintenance,

    deleteMaintenance,

} = require("../controllers/maintenance.controller");

router.get(
    "/",
    verifyJWT,
    getMaintenance
);

router.post(
    "/",
    verifyJWT,
    createMaintenance
);

router.put(
    "/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    updateMaintenance
);

router.put(
    "/complete/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    completeMaintenance
);

router.delete(
    "/:id",
    verifyJWT,
    verifyRole("Admin"),
    deleteMaintenance
);

module.exports = router;