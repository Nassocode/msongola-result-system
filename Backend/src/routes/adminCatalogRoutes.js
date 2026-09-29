const express = require("express");
const controller = require("../controllers/adminCatalogController");
const { protect, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/teachers", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getTeachers);
router.get("/subjects", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getSubjects);
router.get("/classes", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getClasses);
router.get("/assignments", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getAssignments);
router.get("/class-teachers", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getClassTeachers);
router.get("/form-coordinators", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getFormCoordinators);
router.get("/form-coordinators/options", authorize("ADMIN"), controller.getFormCoordinatorOptions);
router.post("/form-coordinators", authorize("ADMIN"), controller.createFormCoordinator);
router.patch("/form-coordinators/:id/status", authorize("ADMIN"), controller.updateCatalogStatus);

router.get("/teachers/options", authorize("ADMIN"), controller.getTeacherUserOptions);
router.get("/class-teachers/options", authorize("ADMIN"), controller.getClassTeacherOptions);
router.post("/class-teachers", authorize("ADMIN"), controller.createClassTeacher);
router.patch("/class-teachers/:id/status", authorize("ADMIN"), controller.updateCatalogStatus);
router.post("/teachers", authorize("ADMIN"), controller.createTeacher);
router.post("/subjects", authorize("ADMIN", "ACADEMIC_MASTER"), controller.createSubject);
router.get("/classes/options", authorize("ADMIN", "ACADEMIC_MASTER"), controller.getClassOptions);
router.post("/classes", authorize("ADMIN", "ACADEMIC_MASTER"), controller.createClass);
router.get("/assignments/options", authorize("ADMIN"), controller.getAssignmentOptions);
router.post("/assignments", authorize("ADMIN"), controller.createAssignment);
router.patch("/assignments/:id/status", authorize("ADMIN"), controller.updateCatalogStatus);
router.patch("/:resource/:id/status", authorize("ADMIN", "ACADEMIC_MASTER"), controller.updateCatalogStatus);

module.exports = router;
