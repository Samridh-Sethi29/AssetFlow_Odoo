const express = require("express");

const router = express.Router();

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const {

    createBooking,

    approveBooking,

    rejectBooking,

    getBookings,

    deleteBooking,

} = require("../controllers/booking.controller");

router.get(
    "/",
    verifyJWT,
    getBookings
);

router.post(
    "/",
    verifyJWT,
    createBooking
);

router.put(
    "/approve/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    approveBooking
);

router.put(
    "/reject/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    rejectBooking
);

router.delete(
    "/:id",
    verifyJWT,
    deleteBooking
);

module.exports = router;