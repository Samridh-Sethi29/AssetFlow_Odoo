const Booking = require("../models/Booking");
const Asset = require("../models/Asset");
const { logActivity } = require("../services/activity.service");

const {
    successResponse,
    errorResponse,
} = require("../utils/response");

const createBooking = async (req, res) => {

    try {

        const {
            asset,
            startTime,
            endTime,
            purpose,
        } = req.body;

        if (!asset || !startTime || !endTime || !purpose) {
            return errorResponse(res, "Asset, start time, end time and purpose are required.", 400);
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
            return errorResponse(res, "End time must be later than start time.", 400);
        }

        const assetDoc = await Asset.findById(asset);
        if (!assetDoc) {
            return errorResponse(res, "Asset not found.", 404);
        }

        if (["Lost", "Retired", "Disposed", "Maintenance"].includes(assetDoc.status)) {
            return errorResponse(res, "This asset is not available for booking.", 400);
        }

        const overlap = await Booking.findOne({

            asset,

            status: "Approved",

            $or: [

                {
                    startTime: {
                        $lt: end,
                    },

                    endTime: {
                        $gt: start,
                    },
                },

            ],

        });

        if (overlap) {

            return errorResponse(
                res,
                "This resource is already booked for the selected time slot.",
                400
            );

        }

        const booking = await Booking.create({

            asset,

            employee: req.user.id,

            bookingDate: new Date(),

            startTime: start,

            endTime: end,

            purpose,

        });

        await logActivity({
            userId: req.user.id,
            module: "Booking",
            action: "CREATE",
            description: "Submitted a resource booking request.",
            req,
        });

        return successResponse(
            res,
            "Booking request submitted.",
            booking,
            201
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const approveBooking = async (req, res) => {

    try {

        const booking = await Booking.findById(req.params.id);

        if (!booking) {

            return errorResponse(
                res,
                "Booking not found.",
                404
            );

        }

        if (booking.status !== "Pending") {
            return errorResponse(res, "Only pending bookings can be approved.", 400);
        }

        const asset = await Asset.findById(booking.asset);
        if (!asset || ["Lost", "Retired", "Disposed", "Maintenance"].includes(asset.status)) {
            return errorResponse(res, "The requested asset is no longer bookable.", 400);
        }

        const conflict = await Booking.findOne({
            asset: booking.asset,
            status: "Approved",
            _id: { $ne: booking._id },
            startTime: { $lt: booking.endTime },
            endTime: { $gt: booking.startTime },
        });

        if (conflict) {
            return errorResponse(
                res,
                "Another booking was approved for this time slot.",
                400
            );
        }

        booking.status = "Approved";

        booking.approvedBy = req.user.id;

        await booking.save();

        await logActivity({
            userId: req.user.id,
            module: "Booking",
            action: "APPROVE",
            description: "Approved a resource booking.",
            req,
        });

        return successResponse(
            res,
            "Booking approved.",
            booking
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const rejectBooking = async (req, res) => {

    try {

        const booking = await Booking.findById(req.params.id);

        if (!booking) {

            return errorResponse(
                res,
                "Booking not found.",
                404
            );

        }

        if (booking.status !== "Pending") {
            return errorResponse(res, "Only pending bookings can be rejected.", 400);
        }

        booking.status = "Rejected";

        booking.approvedBy = req.user.id;

        await booking.save();

        await logActivity({
            userId: req.user.id,
            module: "Booking",
            action: "REJECT",
            description: "Rejected a resource booking.",
            req,
        });

        return successResponse(
            res,
            "Booking rejected.",
            booking
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const getBookings = async (req, res) => {

    try {

        const canViewAll = ["Admin", "Asset Manager"].includes(req.user.role);
        const bookings = await Booking.find(canViewAll ? {} : { employee: req.user.id })

            .populate("asset")

            .populate("employee", "name email")

            .populate("approvedBy", "name")

            .sort({ createdAt: -1 });

        return successResponse(
            res,
            "Bookings fetched successfully.",
            bookings
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

const deleteBooking = async (req, res) => {

    try {

        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {

            return errorResponse(
                res,
                "Booking not found.",
                404
            );

        }

        const isManager = ["Admin", "Asset Manager"].includes(req.user.role);
        if (!isManager && booking.employee.toString() !== req.user.id) {
            return errorResponse(res, "You can only cancel your own bookings.", 403);
        }

        if (booking.status === "Approved" && booking.startTime <= new Date()) {
            return errorResponse(res, "An active or past approved booking cannot be cancelled.", 400);
        }

        return successResponse(
            res,
            "Booking deleted successfully."
        );

    } catch (error) {

        return errorResponse(
            res,
            error.message
        );

    }

};

module.exports = {

    createBooking,

    approveBooking,

    rejectBooking,

    getBookings,

    deleteBooking,

};
