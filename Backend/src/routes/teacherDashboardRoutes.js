const express = require("express");
const teacherDashboardController = require("../controllers/teacherDashboardController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
    "/dashboard",
    protect,
    authorize("SUBJECT_TEACHER"),
    teacherDashboardController.getDashboard
);

module.exports = router;
