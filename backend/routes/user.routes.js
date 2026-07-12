const express = require("express");

const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} = require("../controllers/user.controller");

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");

const router = express.Router();

router.get("/", verifyJWT, getUsers);

router.get("/:id", verifyJWT, getUserById);

router.post("/", verifyJWT, verifyRole("Admin"), createUser);

router.put("/:id", verifyJWT, verifyRole("Admin"), updateUser);

router.delete("/:id", verifyJWT, verifyRole("Admin"), deleteUser);

module.exports = router;
