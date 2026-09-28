const pool = require("../config/database");

async function listForUser(userId) {
    const [rows] = await pool.execute(`
        SELECT n.id, n.title, n.message, n.type, n.is_read, n.created_at
        FROM notifications n
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC, n.id DESC
    `, [userId]);
    return rows;
}

async function markRead(userId, notificationId) {
    const [result] = await pool.execute(`
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);
    return result.affectedRows;
}

async function markAllRead(userId) {
    const [result] = await pool.execute(`
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = ? AND is_read = FALSE
    `, [userId]);
    return result.affectedRows;
}

async function countUnread(userId) {
    const [rows] = await pool.execute(
        "SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = FALSE",
        [userId]
    );
    return Number(rows[0]?.total || 0);
}

module.exports = { listForUser, markRead, markAllRead, countUnread };
