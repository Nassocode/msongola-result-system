const model = require("../models/academicOperationsModel");
const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");

function required(value, label) {
    const text = String(value || "").trim();
    if (!text) throw new Error(`${label} inahitajika.`);
    return text;
}

function id(value, label) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1) throw new Error(`${label} si sahihi.`);
    return number;
}

async function createExamination(data) {
    const academicYearId = id(data.academic_year_id, "Academic year");
    const examName = required(data.exam_name, "Jina la mtihani");
    const examType = String(data.exam_type || "OTHER").toUpperCase();
    if (!["MID_TERM", "TERMINAL", "ANNUAL", "OTHER"].includes(examType)) throw new Error("Aina ya mtihani si sahihi.");
    const status = String(data.status || "DRAFT").toUpperCase();
    if (!["DRAFT", "OPEN", "CLOSED"].includes(status)) throw new Error("Hali ya mtihani si sahihi.");
    if (data.start_date && data.end_date && data.end_date < data.start_date) throw new Error("Tarehe ya mwisho lazima iwe baada ya tarehe ya kuanza.");
    const createdId = await model.createExamination({ academic_year_id: academicYearId, exam_name: examName, exam_type: examType, term: data.term, start_date: data.start_date, end_date: data.end_date, status });
    return { id: createdId, exam_name: examName, exam_type: examType, status };
}

async function updateExaminationStatus(rawId, rawStatus) {
    const examinationId = id(rawId, "Mtihani");
    const status = String(rawStatus || "").toUpperCase();
    if (!["DRAFT", "OPEN", "CLOSED"].includes(status)) throw new Error("Hali ya mtihani si sahihi.");
    const affectedRows = await model.updateExaminationStatus(examinationId, status);
    if (!affectedRows) throw new Error("Mtihani haujapatikana.");
    return { id: examinationId, status };
}

async function createClassTeacher(data) {
    const teacherId = id(data.teacher_id, "Mwalimu");
    const classId = id(data.class_id, "Darasa");
    const yearId = id(data.academic_year_id, "Academic year");
    const createdId = await model.createClassTeacher({ teacher_id: teacherId, class_id: classId, academic_year_id: yearId });
    return { id: createdId, teacher_id: teacherId, class_id: classId, academic_year_id: yearId };
}

async function reviewSubmission(submissionId, reviewerId, data) {
    const idValue = id(submissionId, "Submission");
    const status = String(data.status || "").toUpperCase();
    if (!["APPROVED", "RETURNED"].includes(status)) throw new Error("Chagua Approved au Returned.");
    const comment = String(data.review_comment || "").trim();
    if (status === "RETURNED" && !comment) throw new Error("Andika sababu ya kurudisha submission.");
    return model.reviewSubmission(idValue, reviewerId, status, comment);
}

async function getReportDetails(query) {
    const examinationId = id(query.examination_id, "Mtihani");
    const classId = id(query.class_id, "Darasa");
    return model.getReportDetails(examinationId, classId);
}

async function getAcademicMasterProfile(userId) {
    return model.getAcademicMasterProfile(userId);
}

async function changeOwnPassword(userId, data) {
    const currentPassword = String(data.current_password || "");
    const newPassword = String(data.new_password || "");
    if (!currentPassword || !newPassword) throw new Error("Jaza password ya sasa na password mpya.");
    if (newPassword.length < 8) throw new Error("Password mpya iwe na angalau herufi 8.");
    if (newPassword === currentPassword) throw new Error("Password mpya lazima iwe tofauti na ya sasa.");
    const record = await model.getOwnPasswordHash(userId);
    if (!record || !await bcrypt.compare(currentPassword, record.password_hash)) {
        throw new Error("Password ya sasa si sahihi.");
    }
    await userModel.updateUserPassword(userId, await bcrypt.hash(newPassword, 12));
    return { updated: true };
}

module.exports = {
    getExaminations: model.getExaminations,
    getExaminationOptions: model.getExaminationOptions,
    createExamination,
    updateExaminationStatus,
    getAssignments: model.getAssignments,
    getClassTeachers: model.getClassTeachers,
    getClassTeacherOptions: model.getClassTeacherOptions,
    createClassTeacher,
    getSubmissions: model.getSubmissions,
    reviewSubmission,
    getResults: model.getResults,
    getReports: model.getReports,
    getReportOptions: model.getReportOptions,
    getReportDetails,
    getAcademicMasterProfile,
    changeOwnPassword
};
