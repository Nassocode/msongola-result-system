const express = require("express");
const controller = require("../controllers/academicOperationsController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(protect, authorize("ACADEMIC_MASTER"));

router.get("/examinations", controller.getExaminations);
router.get("/examinations/options", controller.getExaminationOptions);
router.post("/examinations", controller.createExamination);
router.patch("/examinations/:id/status", controller.updateExaminationStatus);

router.get("/assignments", controller.getAssignments);

router.get("/class-teachers", controller.getClassTeachers);
router.get("/class-teachers/options", controller.getClassTeacherOptions);
router.post("/class-teachers", controller.createClassTeacher);

router.get("/submissions", controller.getSubmissions);
router.patch("/submissions/:id/review", controller.reviewSubmission);

router.get("/results", controller.getResults);
router.get("/reports", controller.getReports);
router.get("/reports/options", controller.getReportOptions);
router.get("/reports/details", controller.getReportDetails);
router.get("/profile", controller.getAcademicMasterProfile);
router.patch("/profile/password", controller.changeOwnPassword);

module.exports = router;
