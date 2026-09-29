const pool = require("../config/database");

let columnsPromise;

async function getColumns() {
    if (!columnsPromise) {
        columnsPromise = pool.execute("SHOW COLUMNS FROM notifications")
            .then(([rows]) => new Set(rows.map((row) => row.Field)))
            .catch((error) => {
                columnsPromise = null;
                throw error;
            });
    }
    return columnsPromise;
}

async function getRecipientColumn() {
    const columns = await getColumns();
    if (columns.has("recipient_user_id")) return "recipient_user_id";
    if (columns.has("user_id")) return "user_id";
    throw new Error("Notification recipient column is missing.");
}

async function listForUser(userId) {
    const recipientColumn = await getRecipientColumn();
    const [rows] = await pool.execute(`
        SELECT n.id, n.title, n.message, n.type, n.is_read, n.created_at
        FROM notifications n
        WHERE n.${recipientColumn} = ?
        ORDER BY n.created_at DESC, n.id DESC
    `, [userId]);
    return rows;
}

async function createForUser(userId, notification, connection = pool) {
    const columns = await getColumns();
    const recipientColumn = columns.has("recipient_user_id") ? "recipient_user_id" : "user_id";
    if (!columns.has(recipientColumn)) throw new Error("Notification recipient column is missing.");

    const fields = [recipientColumn, "title", "message", "type"];
    const values = [userId, notification.title, notification.message, notification.type || "SYSTEM_MESSAGE"];
    if (columns.has("sender_user_id")) {
        fields.push("sender_user_id");
        values.push(notification.senderUserId || null);
    }
    if (columns.has("reference_type")) {
        fields.push("reference_type");
        values.push(notification.referenceType || null);
    }
    if (columns.has("reference_id")) {
        fields.push("reference_id");
        values.push(notification.referenceId || null);
    }

    const placeholders = fields.map(() => "?").join(", ");
    await connection.execute(
        `INSERT INTO notifications (${fields.join(", ")}) VALUES (${placeholders})`,
        values
    );
}

async function markRead(userId, notificationId) {
    const recipientColumn = await getRecipientColumn();
    const [result] = await pool.execute(`
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = ? AND ${recipientColumn} = ?
    `, [notificationId, userId]);
    return result.affectedRows;
}

async function markAllRead(userId) {
    const recipientColumn = await getRecipientColumn();
    const [result] = await pool.execute(`
        UPDATE notifications
        SET is_read = TRUE
        WHERE ${recipientColumn} = ? AND is_read = FALSE
    `, [userId]);
    return result.affectedRows;
}

async function countUnread(userId) {
    const recipientColumn = await getRecipientColumn();
    const [rows] = await pool.execute(
        `SELECT COUNT(*) AS total FROM notifications WHERE ${recipientColumn} = ? AND is_read = FALSE`,
        [userId]
    );
    return Number(rows[0]?.total || 0);
}

module.exports = { listForUser, createForUser, markRead, markAllRead, countUnread };
