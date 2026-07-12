/**
 * One-time seed script: creates an initial Admin user so you can log in
 * on a fresh database.
 *
 * Usage:  node scripts/seed.js
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const User = require("../models/User");

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@assetflow.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

const run = async () => {
  await connectDB();

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({
    name: "Admin",
    email: ADMIN_EMAIL,
    password: hashedPassword,
    role: "Admin",
    status: "Active",
  });

  console.log("Admin user created:");
  console.log(`  email:    ${ADMIN_EMAIL}`);
  console.log(`  password: ${ADMIN_PASSWORD}`);
  console.log("Change this password after first login.");

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
