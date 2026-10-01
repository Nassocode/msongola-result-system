const express = require("express");

const schoolSettingsController =
    require("../controllers/schoolSettingsController");

const {
    protect,
    authorize
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
    "/branding",
    schoolSettingsController.getPublicBranding
);


// =========================================================
// GET ACTIVE SCHOOL SETTINGS
// GET /api/school-settings
// =========================================================

router.get(
    "/",
    protect,
    authorize("ADMIN"),
    schoolSettingsController.getSchoolSettings
);


// =========================================================
// UPDATE ACTIVE SCHOOL SETTINGS
// PUT /api/school-settings
// =========================================================
//
// Hii ndiyo endpoint ambayo frontend yetu inatumia.
// Admin hahitaji kujua ID ya school settings.
//

router.put(
    "/",
    protect,
    authorize("ADMIN"),
    schoolSettingsController.updateCurrentSchoolSettings
);


// =========================================================
// CREATE SCHOOL SETTINGS
// POST /api/school-settings
// =========================================================

router.post(
    "/",
    protect,
    authorize("ADMIN"),
    schoolSettingsController.createSchoolSettings
);


// =========================================================
// GET SCHOOL SETTINGS BY ID
// GET /api/school-settings/:id
// =========================================================

router.get(
    "/:id",
    protect,
    authorize("ADMIN"),
    schoolSettingsController.getSchoolSettingsById
);


// =========================================================
// UPDATE SCHOOL SETTINGS BY ID
// PUT /api/school-settings/:id
// =========================================================
//
// Tunaacha endpoint hii kwa compatibility.
//

router.put(
    "/:id",
    protect,
    authorize("ADMIN"),
    schoolSettingsController.updateSchoolSettings
);


// =========================================================
// UPDATE SCHOOL LOGO
// PATCH /api/school-settings/:id/logo
// =========================================================

router.patch(
    "/:id/logo",
    protect,
    authorize("ADMIN"),
    schoolSettingsController.updateSchoolLogo
);


module.exports = router;