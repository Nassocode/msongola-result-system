const express = require("express");
const controller = require("../controllers/teacherMarksController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(protect, authorize("SUBJECT_TEACHER"));
router.get("/entry", controller.getEntryContext);
router.put("/draft", controller.saveDraft);
router.post("/submit", controller.submit);

module.exports = router;
