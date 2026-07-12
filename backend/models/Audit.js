const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    auditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    auditDate: {
      type: Date,
      default: Date.now,
    },

    expectedLocation: {
      type: String,
      default: "",
      trim: true,
    },

    actualLocation: {
      type: String,
      default: "",
      trim: true,
    },

    result: {
      type: String,
      enum: ["Matched", "Missing", "Damaged"],
      required: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Audit", auditSchema);