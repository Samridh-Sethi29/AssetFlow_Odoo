const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    assetName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    purchaseDate: {
      type: Date,
      default: null,
    },

    purchasePrice: {
      type: Number,
      default: 0,
    },

    warrantyStart: {
      type: Date,
      default: null,
    },

    warrantyEnd: {
      type: Date,
      default: null,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    model: {
      type: String,
      default: "",
      trim: true,
    },

    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    qrCode: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Available",
        "Allocated",
        "Reserved",
        "Maintenance",
        "Lost",
        "Retired",
        "Disposed",
      ],
      default: "Available",
    },

    condition: {
      type: String,
      enum: [
        "Excellent",
        "Good",
        "Fair",
        "Poor",
        "Damaged",
      ],
      default: "Excellent",
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    images: [
      {
        type: String,
      },
    ],

    documents: [
      {
        type: String,
      },
    ],

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    customValues: {
      type: Map,
      of: String,
      default: {},
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    history: [
      {
        action: {
          type: String,
          enum: [
            "CREATED",
            "UPDATED",
            "ALLOCATED",
            "RETURNED",
            "TRANSFERRED",
            "MAINTENANCE",
            "AUDITED",
            "STATUS_CHANGED",
            "DELETED",
          ],
          required: true,
        },

        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        description: {
          type: String,
          default: "",
        },

        timestamp: {
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

module.exports = mongoose.model("Asset", assetSchema);