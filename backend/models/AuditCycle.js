const mongoose = require("mongoose");

const auditCycleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    scopeDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    scopeLocation: {
      type: String,
      default: "",
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    assignedAuditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    results: [
      {
        asset: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Asset",
          required: true,
        },
        status: {
          type: String,
          enum: ["Pending", "Verified", "Missing", "Damaged"],
          default: "Pending",
        },
        actualLocation: {
          type: String,
          default: "",
        },
        remarks: {
          type: String,
          default: "",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditCycle", auditCycleSchema);
