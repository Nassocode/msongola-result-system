const db = require("../config/database");

function normalizeAuditPayload(payload = {}) {
    const action = String(payload.action || "").trim();
    const moduleName = String(payload.module || "").trim();
    if (!action) throw new Error("Audit action inahitajika");
    if (!moduleName) throw new Error("Audit module inahitajika");

    const description = payload.description ? String(payload.description).trim() : null;
    const recordId = payload.record_id !== undefined && payload.record_id !== null ? Number(payload.record_id) : null;
    const oldValues = payload.old_values && Object.keys(payload.old_values || {}).length ? payload.old_values : null;
    const newValues = payload.new_values && Object.keys(payload.new_values || {}).length ? payload.new_values : null;

    return {
        user_id: payload.user_id !== undefined && payload.user_id !== null ? Number(payload.user_id) : null,
        action,
        module: moduleName,
        description,
        record_id: Number.isFinite(recordId) ? recordId : null,
        old_values: oldValues,
        new_values: newValues && description ? { ...newValues, description } : newValues || (description ? { description } : null),
        ip_address: payload.ip_address || null,
        user_agent: payload.user_agent || null
    };
}

async function createAuditLog(data = {}) {
    const payload = normalizeAuditPayload(data);

    const [result] = await db.execute(
        `
        INSERT INTO audit_logs
            (user_id, action, module, record_id, description, old_values, new_values, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            payload.user_id,
            payload.action,
            payload.module,
            payload.record_id,
            payload.description,
            payload.old_values ? JSON.stringify(payload.old_values) : null,
            payload.new_values ? JSON.stringify(payload.new_values) : null,
            payload.ip_address,
            payload.user_agent
        ]
    );

    const [rows] = await db.query(
        `
        SELECT al.id, al.user_id, al.action, al.module, al.record_id, al.old_values, al.new_values,
               al.ip_address, al.user_agent, al.created_at,
               u.username, u.role,
               COALESCE(
                   JSON_UNQUOTE(JSON_EXTRACT(al.new_values, '$.description')),
                   al.description,
                   JSON_UNQUOTE(JSON_EXTRACT(al.old_values, '$.description')),
                   al.action
               ) AS description
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE al.id = ?
        LIMIT 1
        `,
        [result.insertId]
    );

    return rows[0] || { id: result.insertId };
}

async function getAllAuditLogs() {
    const [rows] = await db.query(
        `
        SELECT al.id, al.user_id, al.action, al.module, al.record_id, al.old_values, al.new_values,
               al.ip_address, al.user_agent, al.created_at,
               u.username, u.role,
               COALESCE(
                   JSON_UNQUOTE(JSON_EXTRACT(al.new_values, '$.description')),
                   al.description,
                   JSON_UNQUOTE(JSON_EXTRACT(al.old_values, '$.description')),
                   al.action
               ) AS description
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        ORDER BY al.created_at DESC
        `
    );

    return rows;
}

async function getAuditLogById(id) {
    const [rows] = await db.query(
        `
        SELECT al.id, al.user_id, al.action, al.module, al.record_id, al.old_values, al.new_values,
               al.ip_address, al.user_agent, al.created_at,
               u.username, u.role,
               COALESCE(
                   JSON_UNQUOTE(JSON_EXTRACT(al.new_values, '$.description')),
                   al.description,
                   JSON_UNQUOTE(JSON_EXTRACT(al.old_values, '$.description')),
                   al.action
               ) AS description
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE al.id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0] || null;
}

async function getAuditLogsByUser(userId) {
    const [rows] = await db.query(
        `
        SELECT al.id, al.user_id, al.action, al.module, al.record_id, al.old_values, al.new_values,
               al.ip_address, al.user_agent, al.created_at,
               u.username, u.role,
               COALESCE(
                   JSON_UNQUOTE(JSON_EXTRACT(al.new_values, '$.description')),
                   JSON_UNQUOTE(JSON_EXTRACT(al.old_values, '$.description')),
                   al.action
               ) AS description
        FROM audit_logs al
        LEFT JOIN users u ON u.id = al.user_id
        WHERE al.user_id = ?
        ORDER BY al.created_at DESC
        `,
        [userId]
    );

    return rows;
}

module.exports = {
    createAuditLog,
    getAllAuditLogs,
    getAuditLogById,
    getAuditLogsByUser
};