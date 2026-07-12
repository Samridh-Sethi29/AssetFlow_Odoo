const express = require("express");

const {
    getStats,
    getRecentAssets,
    getActivityFeed,
    getCharts,
} = require("../controllers/dashboard.controller");

const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.get("/stats", verifyJWT, getStats);

router.get("/recent-assets", verifyJWT, getRecentAssets);

router.get("/activity", verifyJWT, getActivityFeed);

router.get("/charts", verifyJWT, getCharts);

module.exports = router;
