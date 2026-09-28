const notificationService = require("../services/notificationService");

function sendError(res, error) {
    const status = /haijapatikana|si sahihi/i.test(error.message) ? 404 : 400;
    return res.status(status).json({ success: false, message: error.message });
}

async function list(req, res) {
    try {
        return res.json({ success: true, data: await notificationService.list(req.user.id) });
    } catch (error) {
        console.error("List notifications error:", error.message);
        return sendError(res, error);
    }
}

async function markRead(req, res) {
    try {
        return res.json({ success: true, data: await notificationService.markRead(req.user.id, req.params.id) });
    } catch (error) {
        return sendError(res, error);
    }
}

async function markAllRead(req, res) {
    try {
        return res.json({ success: true, data: await notificationService.markAllRead(req.user.id) });
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = { list, markRead, markAllRead };
