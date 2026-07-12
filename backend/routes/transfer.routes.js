const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");
const {
  createTransfer,
  getTransfers,
  approveTransfer,
  rejectTransfer,
} = require("../controllers/transfer.controller");

router.post("/", verifyJWT, createTransfer);
router.get("/", verifyJWT, getTransfers);
router.put("/approve/:id", verifyJWT, verifyRole("Admin", "Asset Manager", "Department Head"), approveTransfer);
router.put("/reject/:id", verifyJWT, verifyRole("Admin", "Asset Manager", "Department Head"), rejectTransfer);

module.exports = router;
