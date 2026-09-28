const express = require("express");

const studentController = require("../controllers/studentController");
const {
    protect,
    authorize
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
    "/",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentController.getStudents
);

router.get(
    "/classes",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentController.getClassOptions
);

router.get(
    "/:id",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentController.getStudentById
);

router.post(
    "/",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentController.createStudent
);

router.put(
    "/:id",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentController.updateStudent
);

router.patch(
    "/:id/status",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentController.updateStudentStatus
);

module.exports = router;
