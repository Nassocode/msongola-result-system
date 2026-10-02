const auditLogModel = require("../models/auditLogModel");

async function createAuditLog(data) {
    if (!data || !data.action) {
        throw new Error("Audit action inahitajika");
    }

    return await auditLogModel.createAuditLog({
        user_id: data.user_id || null,
        action: String(data.action).trim(),
        description: data.description ? String(data.description).trim() : null,
        module: data.module ? String(data.module).trim() : "SYSTEM",
        record_id: data.record_id ?? null,
        old_values: data.old_values || null,
        new_values: data.new_values || null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null
    });
}

async function getAllAuditLogs() {
    return await auditLogModel.getAllAuditLogs();
}

async function getAuditLogById(id) {
    const log = await auditLogModel.getAuditLogById(id);
    if (!log) throw new Error("Audit log haijapatikana");
    return log;
}

async function getAuditLogsByUser(userId) {
    return await auditLogModel.getAuditLogsByUser(userId);
}

module.exports = {
    createAuditLog,
    getAllAuditLogs,
    getAuditLogById,
    getAuditLogsByUser
};