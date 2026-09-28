const markModel = require("../models/Mark");

function parsePositiveId(value, label) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new Error(`${label} sio sahihi.`);
    return id;
}

async function getEntryContext(userId, query) {
    const assignmentId = parsePositiveId(query.assignment_id, "Assignment ID");
    const examinationId = query.examination_id ? parsePositiveId(query.examination_id, "Examination ID") : null;
    return markModel.getEntryContext(userId, assignmentId, examinationId);
}

async function saveDraft(userId, body) {
    const assignmentId = parsePositiveId(body.assignment_id, "Assignment ID");
    const examinationId = parsePositiveId(body.examination_id, "Examination ID");
    if (!Array.isArray(body.marks)) throw new Error("Orodha ya alama haipo.");
    return markModel.saveDraftMarks(userId, assignmentId, examinationId, body.marks);
}

async function submit(userId, body) {
    const assignmentId = parsePositiveId(body.assignment_id, "Assignment ID");
    const examinationId = parsePositiveId(body.examination_id, "Examination ID");
    return markModel.submitMarks(userId, assignmentId, examinationId);
}

module.exports = { getEntryContext, saveDraft, submit };
