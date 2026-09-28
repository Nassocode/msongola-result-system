const express = require("express");

const auditLogController =
    require("../controllers/auditLogController");

const {
    protect,
    authorize
} = require("../middlewares/authMiddleware");

const router = express.Router();


// =========================================================
// GET ALL AUDIT LOGS
// GET /api/audit-logs
// =========================================================

router.get(
    "/",
    protect,
    authorize("ADMIN"),
    auditLogController.getAllAuditLogs
);


// =========================================================
// GET AUDIT LOG BY ID
// GET /api/audit-logs/:id
// =========================================================

router.get(
    "/:id",
    protect,
    authorize("ADMIN"),
    auditLogController.getAuditLogById
);


// =========================================================
// GET AUDIT LOGS BY USER
// GET /api/audit-logs/user/:userId
// =========================================================

router.get(
    "/user/:userId",
    protect,
    authorize("ADMIN"),
    auditLogController.getAuditLogsByUser
);


module.exports = router;