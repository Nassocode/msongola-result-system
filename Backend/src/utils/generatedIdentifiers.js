const { randomUUID } = require("crypto");

function createTemporaryIdentifier() {
    return `PENDING-${randomUUID()}`;
}

function formatIdentifier(prefix, id) {
    return `${prefix}${String(id).padStart(6, "0")}`;
}

function createStudentAdmissionNumber(id) {
    return formatIdentifier("MGS", id);
}

function createTeacherNumber(id) {
    return formatIdentifier("TCH", id);
}

module.exports = {
    createTemporaryIdentifier,
    createStudentAdmissionNumber,
    createTeacherNumber
};