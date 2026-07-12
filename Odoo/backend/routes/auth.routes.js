const express = require("express");

const {
  register,
  login,
  logout,
  me,
} = require("../controllers/auth.controller");

const verifyJWT = require("../middleware/verifyJWT");
const authRateLimit = require("../middleware/authRateLimit");

const router = express.Router();

router.post("/register", authRateLimit, register);

router.post("/login", authRateLimit, login);

router.post("/logout", verifyJWT, logout);

router.get("/me", verifyJWT, me);

module.exports = router;
