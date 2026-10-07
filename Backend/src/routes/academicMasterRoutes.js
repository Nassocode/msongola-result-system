const express = require("express");

const academicMasterController =
    require("../controllers/academicMasterController");
const studentPromotionController =
    require("../controllers/studentPromotionController");

const {
    protect,
    authorize
} = require("../middlewares/authMiddleware");


const router = express.Router();


/* =========================================================
   ACADEMIC MASTER DASHBOARD
   ========================================================= */

router.get(
    "/dashboard",
    protect,
    authorize("ACADEMIC_MASTER"),
    academicMasterController.getDashboard
);

router.get(
    "/promotions/options",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentPromotionController.getOptions
);

router.post(
    "/promotions/years",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentPromotionController.createAcademicYear
);

router.post(
    "/promotions/activate-year",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentPromotionController.activateAcademicYear
);

router.post(
    "/promotions/preview",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentPromotionController.getPreview
);

router.post(
    "/promotions",
    protect,
    authorize("ACADEMIC_MASTER"),
    studentPromotionController.promote
);


module.exports = router;