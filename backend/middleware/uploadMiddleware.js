const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const folder = file.fieldname === "images" ? "images" : "documents";
    const destination = path.join(uploadRoot, folder);
    fs.mkdirSync(destination, { recursive: true });
    callback(null, destination);
  },
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const documentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, callback) => {
    const allowed = file.fieldname === "images" ? imageTypes : documentTypes;
    if (!allowed.has(file.mimetype)) {
      return callback(new Error(`Unsupported ${file.fieldname} file type.`));
    }
    return callback(null, true);
  },
});

const assetUploads = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "documents", maxCount: 3 },
]);

module.exports = { assetUploads, uploadRoot };
