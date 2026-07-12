const express = require("express");

const {
    getActivity,
    getActivityByUser,
    getActivityByModule,
} = require("../controllers/activity.controller");

const verifyJWT = require("../middleware/verifyJWT");

const router = express.Router();

router.get("/", verifyJWT, getActivity);

router.get("/user/:id", verifyJWT, getActivityByUser);

router.get("/module/:module", verifyJWT, getActivityByModule);

module.exports = router;
