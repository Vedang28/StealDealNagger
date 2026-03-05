const express = require("express");
const multer = require("multer");
const { authenticate, authorize } = require("../middleware/auth");
const importController = require("../controllers/importController");

const router = express.Router();

// Configure multer for CSV file upload (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

// POST /api/v1/import/csv — Upload and import a CSV file
router.post(
  "/csv",
  authenticate,
  authorize("admin", "manager"),
  upload.single("file"),
  importController.uploadCSV,
);

// GET /api/v1/import/history — Get import history
router.get("/history", authenticate, importController.getImportHistory);

module.exports = router;
