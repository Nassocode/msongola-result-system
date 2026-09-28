const notificationModel = require("../models/Notification");

function parseId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new Error("Notification ID si sahihi.");
    return id;
}

async function list(userId) {
    const [notifications, unreadCount] = await Promise.all([
        notificationModel.listForUser(userId),
        notificationModel.countUnread(userId)
    ]);
    return { notifications, unread_count: unreadCount };
}

async function markRead(userId, rawId) {
    const id = parseId(rawId);
    if (!await notificationModel.markRead(userId, id)) throw new Error("Arifa haijapatikana.");
    return { id, is_read: true };
}

async function markAllRead(userId) {
    return { updated: await notificationModel.markAllRead(userId) };
}

module.exports = { list, markRead, markAllRead };
