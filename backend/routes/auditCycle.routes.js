const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");
const {
  createAuditCycle,
  getAuditCycles,
  updateAuditItem,
  closeAuditCycle,
} = require("../controllers/auditCycle.controller");

router.post("/", verifyJWT, verifyRole("Admin", "Asset Manager"), createAuditCycle);
router.get("/", verifyJWT, getAuditCycles);
router.put("/item/:id", verifyJWT, updateAuditItem);
router.put("/close/:id", verifyJWT, verifyRole("Admin", "Asset Manager"), closeAuditCycle);

module.exports = router;
