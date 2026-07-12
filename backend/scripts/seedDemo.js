const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");
const Department = require("../models/Department");
const Category = require("../models/Category");
const Vendor = require("../models/Vendor");
const Asset = require("../models/Asset");

const run = async () => {
  require("dotenv").config();
  await connectDB();

  console.log("Seeding demo data...");

  // Clear existing collections to start fresh
  await Promise.all([
    User.deleteMany({ email: { $ne: "admin@assetflow.com" } }), // Keep admin
    Department.deleteMany({}),
    Category.deleteMany({}),
    Vendor.deleteMany({}),
    Asset.deleteMany({}),
  ]);

  // Find admin user
  let admin = await User.findOne({ email: "admin@assetflow.com" });
  if (!admin) {
    const hashedPassword = await bcrypt.hash("Admin@12345", 10);
    admin = await User.create({
      name: "Admin",
      email: "admin@assetflow.com",
      password: hashedPassword,
      role: "Admin",
      status: "Active",
    });
  }

  // 1. Create Departments
  const deptIT = await Department.create({
    departmentName: "Information Technology",
    departmentCode: "IT",
    location: "Floor 3, Tech Wing",
    status: "Active",
  });

  const deptHR = await Department.create({
    departmentName: "Human Resources",
    departmentCode: "HR",
    location: "Floor 2, Room 204",
    status: "Active",
  });

  // 2. Create Categories with Custom Fields
  const catLaptops = await Category.create({
    name: "Laptops",
    description: "Office workstations and laptops",
    icon: "pi pi-desktop",
    customFields: [
      { name: "RAM (GB)", type: "number" },
      { name: "Storage", type: "text" },
    ],
  });

  const catRooms = await Category.create({
    name: "Conference Rooms",
    description: "Shared meeting rooms and spaces",
    icon: "pi pi-home",
    customFields: [
      { name: "Capacity", type: "number" },
      { name: "AV Equipment", type: "text" },
    ],
  });

  // 3. Create Vendors
  const vendorDell = await Vendor.create({
    vendorName: "Dell Inc.",
    contactPerson: "Michael Dell",
    email: "sales@dell.com",
    phone: "1-800-456-3355",
  });

  // 4. Create Assets
  await Asset.create({
    assetTag: "AF-0001",
    assetName: "Dell XPS 15",
    category: catLaptops._id,
    vendor: vendorDell._id,
    department: deptIT._id,
    brand: "Dell",
    model: "XPS 15 9520",
    serialNumber: "DELL-XPS-9921",
    location: "IT Server Room",
    purchasePrice: 1500,
    status: "Available",
    condition: "Excellent",
    customValues: { "RAM (GB)": "16", "Storage": "512GB SSD" },
    createdBy: admin._id,
  });

  await Asset.create({
    assetTag: "AF-0002",
    assetName: "Conference Room B2",
    category: catRooms._id,
    brand: "In-House",
    model: "B2 Space",
    serialNumber: "ROOM-B2-HQ",
    location: "Floor 2, Corridor East",
    status: "Available",
    condition: "Excellent",
    customValues: { "Capacity": "12", "AV Equipment": "Projector, Polycom Video Hub" },
    createdBy: admin._id,
  });

  // 5. Create Employees (Asset Manager & Department Head)
  const hashedUserPassword = await bcrypt.hash("User@12345", 10);
  await User.create({
    name: "Jane Smith",
    email: "jane@assetflow.com",
    password: hashedUserPassword,
    role: "Asset Manager",
    department: deptIT._id,
    status: "Active",
  });

  await User.create({
    name: "Robert Johnson",
    email: "robert@assetflow.com",
    password: hashedUserPassword,
    role: "Department Head",
    department: deptHR._id,
    status: "Active",
  });

  console.log("Demo database seeding complete!");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
