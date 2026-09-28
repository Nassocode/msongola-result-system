const teacherMarksService = require("../services/teacherMarksService");

function sendError(res, error) {
    const status = /ruhusa|haipo|hujapewa|haujafunguliwa/i.test(error.message) ? 403 : 400;
    return res.status(status).json({ success: false, message: error.message });
}

async function getEntryContext(req, res) {
    try {
        return res.json({ success: true, data: await teacherMarksService.getEntryContext(req.user.id, req.query) });
    } catch (error) {
        return sendError(res, error);
    }
}

async function saveDraft(req, res) {
    try {
        return res.json({ success: true, message: "Alama zimehifadhiwa kama draft.", data: await teacherMarksService.saveDraft(req.user.id, req.body) });
    } catch (error) {
        return sendError(res, error);
    }
}

async function submit(req, res) {
    try {
        return res.json({ success: true, message: "Alama zimetumwa kwa mapitio.", data: await teacherMarksService.submit(req.user.id, req.body) });
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = { getEntryContext, saveDraft, submit };
