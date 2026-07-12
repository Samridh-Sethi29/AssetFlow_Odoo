const express = require("express");

const {
    getAudits,
    getAuditById,
    createAudit,
    updateAudit,
    deleteAudit,
} = require("../controllers/audit.controller");

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const router = express.Router();

router.get("/", verifyJWT, getAudits);

router.get("/:id", verifyJWT, getAuditById);

router.post(
    "/",
    verifyJWT,
    verifyRole("Admin", "Asset Manager", "Department Head"),
    createAudit
);

router.put(
    "/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager", "Department Head"),
    updateAudit
);

router.delete("/:id", verifyJWT, verifyRole("Admin"), deleteAudit);

module.exports = router;
