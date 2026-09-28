const auditLogModel =
    require("../models/auditLogModel");


// =========================================================
// CREATE AUDIT LOG
// =========================================================

async function createAuditLog(data) {

    if (!data.action) {
        throw new Error(
            "Audit action inahitajika"
        );
    }

    return await auditLogModel.createAuditLog({
        user_id: data.user_id || null,

        action: String(
            data.action
        ).trim(),

        description:
            data.description
                ? String(data.description).trim()
                : null,

        module:
            data.module
                ? String(data.module).trim()
                : null,

        ip_address:
            data.ip_address || null,

        user_agent:
            data.user_agent || null
    });
}


// =========================================================
// GET ALL AUDIT LOGS
// =========================================================

async function getAllAuditLogs() {

    return await auditLogModel
        .getAllAuditLogs();
}


// =========================================================
// GET AUDIT LOG BY ID
// =========================================================

async function getAuditLogById(id) {

    const log =
        await auditLogModel
            .getAuditLogById(id);

    if (!log) {
        throw new Error(
            "Audit log haijapatikana"
        );
    }

    return log;
}


// =========================================================
// GET AUDIT LOGS BY USER
// =========================================================

async function getAuditLogsByUser(userId) {

    return await auditLogModel
        .getAuditLogsByUser(userId);
}


module.exports = {
    createAuditLog,
    getAllAuditLogs,
    getAuditLogById,
    getAuditLogsByUser
};