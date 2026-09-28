const auditLogService =
    require("../services/auditLogService");


// =========================================================
// GET ALL AUDIT LOGS
// =========================================================

async function getAllAuditLogs(req, res) {

    try {

        const logs =
            await auditLogService
                .getAllAuditLogs();

        return res.status(200).json({
            success: true,
            message: "Audit logs zimepatikana",
            data: logs
        });

    } catch (error) {

        console.error(
            "Get audit logs error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// =========================================================
// GET AUDIT LOG BY ID
// =========================================================

async function getAuditLogById(req, res) {

    try {

        const { id } =
            req.params;

        const log =
            await auditLogService
                .getAuditLogById(id);

        return res.status(200).json({
            success: true,
            message: "Audit log imepatikana",
            data: log
        });

    } catch (error) {

        console.error(
            "Get audit log error:",
            error.message
        );

        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
}


// =========================================================
// GET AUDIT LOGS BY USER
// =========================================================

async function getAuditLogsByUser(req, res) {

    try {

        const { userId } =
            req.params;

        const logs =
            await auditLogService
                .getAuditLogsByUser(userId);

        return res.status(200).json({
            success: true,
            message: "Audit logs za mtumiaji zimepatikana",
            data: logs
        });

    } catch (error) {

        console.error(
            "Get user audit logs error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


module.exports = {
    getAllAuditLogs,
    getAuditLogById,
    getAuditLogsByUser
};