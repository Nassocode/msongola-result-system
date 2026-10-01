
"use strict";

const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");

const {
    getReportOptions,
    getReportDetails,
    getReportStudents,
    exportReportExcel,
    exportReportPdf,
    reportHealth
} = require("../controllers/reportController");

const router = express.Router();
router.use(protect, authorize("ACADEMIC_MASTER"));


// =========================================================
// REPORT MODULE HEALTH CHECK
// =========================================================
//
// GET
// /api/academic-master/operations/reports/health
//
// =========================================================

router.get(
    "/health",
    reportHealth
);


// =========================================================
// REPORT CENTER OPTIONS
// =========================================================
//
// GET
// /api/academic-master/operations/reports/options
//
// Returns:
// - Academic Years
// - Examinations
// - Forms
// - Classes
// - Students
// - Subjects
//
// =========================================================

router.get(
    "/options",
    getReportOptions
);

router.get("/students", getReportStudents);


// =========================================================
// GENERATE REPORT
// =========================================================
//
// GET
// /api/academic-master/operations/reports/details
//
// Example:
//
// /details?examination_id=1&class_id=2
//
// Optional filters:
//
// academic_year_id
// examination_id
// form_id
// class_id
// student_id
// subject_id
// report_type
//
// =========================================================

router.get(
    "/details",
    getReportDetails
);

router.post("/exports/excel", exportReportExcel);
router.post("/exports/pdf", exportReportPdf);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;
