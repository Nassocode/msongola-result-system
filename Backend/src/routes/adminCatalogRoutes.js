const express = require("express");
const controller = require("../controllers/adminCatalogController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/teachers", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getTeachers);
router.get("/subjects", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getSubjects);
router.get("/classes", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getClasses);
router.get("/assignments", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getAssignments);

router.get("/teachers/options", authorize("ADMIN"), controller.getTeacherUserOptions);
router.post("/teachers", authorize("ADMIN"), controller.createTeacher);
router.post("/subjects", authorize("ADMIN", "ACADEMIC_MASTER"), controller.createSubject);
router.get("/classes/options", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getClassOptions);
router.post("/classes", authorize("ADMIN", "ACADEMIC_MASTER"), controller.createClass);
router.get("/assignments/options", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getAssignmentOptions);
router.post("/assignments", authorize("ADMIN", "ACADEMIC_MASTER"), controller.createAssignment);
router.patch("/:resource/:id/status", authorize("ADMIN", "ACADEMIC_MASTER"), controller.updateCatalogStatus);

module.exports = router;
