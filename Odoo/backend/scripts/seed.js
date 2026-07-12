/**
 * Idempotent demo-data seed.
 * Usage: npm run seed
 * It creates missing records but never deletes existing data.
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Department = require("../models/Department");
const Category = require("../models/Category");
const Vendor = require("../models/Vendor");
const Asset = require("../models/Asset");
const Allocation = require("../models/Allocation");
const Booking = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Audit = require("../models/Audit");
const Activity = require("../models/Activity");

const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

const upsert = async (Model, filter, values) => {
  await Model.updateOne(filter, { $setOnInsert: values }, { upsert: true });
  return Model.findOne(filter);
};

const run = async () => {
  await connectDB();
  const hash = await bcrypt.hash(password, 10);

  const engineering = await upsert(Department, { departmentCode: "ENG" }, {
    departmentName: "Engineering", departmentCode: "ENG", location: "Bengaluru", status: "Active",
  });
  const operations = await upsert(Department, { departmentCode: "OPS" }, {
    departmentName: "Operations", departmentCode: "OPS", location: "Mumbai", status: "Active",
  });

  const admin = await upsert(User, { email: "admin@assetflow.com" }, {
    name: "Aarav Mehta", email: "admin@assetflow.com", password: hash, role: "Admin", status: "Active",
  });
  const manager = await upsert(User, { email: "priya.shah@assetflow.com" }, {
    name: "Priya Shah", email: "priya.shah@assetflow.com", password: hash, role: "Asset Manager",
    department: operations._id, phone: "+91 98765 43210", status: "Active",
  });
  const employee = await upsert(User, { email: "rohan.kumar@assetflow.com" }, {
    name: "Rohan Kumar", email: "rohan.kumar@assetflow.com", password: hash, role: "Employee",
    department: engineering._id, phone: "+91 98765 43211", status: "Active",
  });
  const head = await upsert(User, { email: "neha.iyer@assetflow.com" }, {
    name: "Neha Iyer", email: "neha.iyer@assetflow.com", password: hash, role: "Department Head",
    department: engineering._id, phone: "+91 98765 43212", status: "Active",
  });
  await Department.updateOne({ _id: engineering._id }, { manager: head._id });
  await Department.updateOne({ _id: operations._id }, { manager: manager._id });

  const laptops = await upsert(Category, { name: "Laptops" }, { name: "Laptops", description: "Employee laptops", icon: "pi pi-desktop" });
  const displays = await upsert(Category, { name: "Displays" }, { name: "Displays", description: "Monitors and displays", icon: "pi pi-desktop" });
  const networking = await upsert(Category, { name: "Networking" }, { name: "Networking", description: "Network equipment", icon: "pi pi-wifi" });
  const acme = await upsert(Vendor, { vendorName: "Acme Technology" }, {
    vendorName: "Acme Technology", contactPerson: "Kavita Rao", email: "support@acmetech.example", phone: "+91 80 4000 1122", address: "Bengaluru",
  });
  const orbit = await upsert(Vendor, { vendorName: "Orbit Systems" }, {
    vendorName: "Orbit Systems", contactPerson: "Nikhil Jain", email: "sales@orbitsystems.example", phone: "+91 22 4000 2211", address: "Mumbai",
  });

  const assetSpecs = [
    ["AF-LAP-001", "MacBook Pro 14", laptops, acme, engineering, "Allocated", "Excellent", "SN-MBP-001", "Engineering Bay A"],
    ["AF-LAP-002", "ThinkPad X1 Carbon", laptops, orbit, operations, "Available", "Good", "SN-TPX-002", "Operations Floor"],
    ["AF-DSP-001", "Dell UltraSharp 27", displays, acme, engineering, "Available", "Excellent", "SN-DLL-003", "Meeting Room 2"],
    ["AF-NET-001", "Cisco Meraki MX", networking, orbit, operations, "Maintenance", "Fair", "SN-MRK-004", "Server Room"],
    ["AF-DSP-002", "Samsung Smart Display", displays, acme, operations, "Available", "Good", "SN-SAM-005", "Training Room"],
  ];

  const assets = {};
  for (const [assetTag, assetName, category, vendor, department, status, condition, serialNumber, location] of assetSpecs) {
    assets[assetTag] = await upsert(Asset, { assetTag }, {
      assetTag, assetName, category: category._id, vendor: vendor._id, department: department._id,
      purchaseDate: new Date("2025-01-15"), purchasePrice: 125000, brand: assetName.split(" ")[0],
      model: assetName, serialNumber, status, condition, location, createdBy: admin._id,
      history: [{ action: "CREATED", performedBy: admin._id, description: "Seeded demo asset." }],
    });
  }

  await upsert(Allocation, { asset: assets["AF-LAP-001"]._id, allocationStatus: "Allocated" }, {
    asset: assets["AF-LAP-001"]._id, employee: employee._id, allocatedBy: manager._id,
    expectedReturnDate: new Date("2026-12-31"), allocationStatus: "Allocated", remarks: "Primary work laptop",
  });

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const twoHoursLater = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);
  await upsert(Booking, { asset: assets["AF-DSP-001"]._id, purpose: "Sprint planning presentation" }, {
    asset: assets["AF-DSP-001"]._id, employee: employee._id, approvedBy: manager._id,
    startTime: tomorrow, endTime: twoHoursLater, purpose: "Sprint planning presentation", status: "Approved",
  });
  await upsert(Booking, { asset: assets["AF-DSP-002"]._id, purpose: "Team training session" }, {
    asset: assets["AF-DSP-002"]._id, employee: head._id, startTime: tomorrow, endTime: twoHoursLater,
    purpose: "Team training session", status: "Pending",
  });

  await upsert(Maintenance, { asset: assets["AF-NET-001"]._id, status: "In Progress" }, {
    asset: assets["AF-NET-001"]._id, issue: "Intermittent network connectivity",
    description: "WAN link drops during peak hours.", reportedBy: manager._id, assignedVendor: orbit._id,
    priority: "High", status: "In Progress", estimatedCost: 18000, startDate: new Date(),
  });

  await upsert(Audit, { asset: assets["AF-LAP-002"]._id, auditor: manager._id }, {
    asset: assets["AF-LAP-002"]._id, auditor: manager._id, expectedLocation: "Operations Floor",
    actualLocation: "Operations Floor", result: "Matched", remarks: "Asset verified during quarterly audit.",
  });

  for (const [module, action, description] of [
    ["Asset", "CREATE", "Demo assets were added to the inventory."],
    ["Allocation", "ALLOCATE", "MacBook Pro 14 allocated to Rohan Kumar."],
    ["Maintenance", "CREATE", "Maintenance opened for Cisco Meraki MX."],
    ["Booking", "APPROVE", "Meeting room display booking approved."],
  ]) {
    await upsert(Activity, { module, action, description }, { user: manager._id, module, action, description, ipAddress: "127.0.0.1" });
  }

  console.log("Demo data is ready.");
  console.log("Admin login: admin@assetflow.com / " + password);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
