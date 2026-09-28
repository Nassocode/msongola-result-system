const express = require("express");

const academicMasterController =
    require("../controllers/academicMasterController");

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


module.exports = router;