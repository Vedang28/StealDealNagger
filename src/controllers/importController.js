const importService = require("../services/importService");

const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: { message: "No CSV file uploaded" } });
    }

    const result = await importService.importFromCSV(
      req.user.teamId,
      req.file.buffer,
      req.user.id,
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getImportHistory = async (req, res, next) => {
  try {
    const result = await importService.getImportHistory(
      req.user.teamId,
      req.query,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadCSV, getImportHistory };
