const express = require("express");

const router = express.Router();

const verifyJWT = require("../middleware/verifyJWT");
const verifyRole = require("../middleware/verifyRole");
const { assetUploads } = require("../middleware/uploadMiddleware");

const {
    createAsset,
    getAssets,
    getAssetById,
    updateAsset,
    deleteAsset,
    searchAssets,
    filterAssets,
    getAssetHistory,
} = require("../controllers/asset.controller");

router.post(
    "/",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    assetUploads,
    createAsset
);

router.get(
    "/",
    verifyJWT,
    getAssets
);

router.get(
    "/search",
    verifyJWT,
    searchAssets
);

router.get(
    "/filter",
    verifyJWT,
    filterAssets
);

router.get(
    "/:id",
    verifyJWT,
    getAssetById
);

router.put(
    "/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    assetUploads,
    updateAsset
);

router.delete(
    "/:id",
    verifyJWT,
    verifyRole("Admin", "Asset Manager"),
    deleteAsset
);

router.get(
    "/history/:id",
    verifyJWT,
    getAssetHistory
);

module.exports = router;
