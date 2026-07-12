const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    allocationDate: {
      type: Date,
      default: Date.now,
    },

    expectedReturnDate: {
      type: Date,
      default: null,
    },

    returnedDate: {
      type: Date,
      default: null,
    },

    allocationStatus: {
      type: String,
      enum: ["Allocated", "Returned", "Overdue"],
      default: "Allocated",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
    assetConditionAtReturn: {
        type: String,
        enum: [
            "Excellent",
            "Good",
            "Fair",
            "Poor",
            "Damaged",
        ],
        default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Allocation", allocationSchema);