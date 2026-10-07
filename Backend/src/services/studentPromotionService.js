const studentModel = require("../models/studentModel");
const promotionModel = require("../models/studentPromotionModel");
const studentService = require("./studentService");

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getOptions() {
    return promotionModel.getPromotionOptions();
}

async function activateAcademicYear(value) {
    const academicYearId = Number(value);
    if (!Number.isInteger(academicYearId) || academicYearId < 1) {
        throw new Error("Academic year ID si sahihi.");
    }
    return promotionModel.activateAcademicYear(academicYearId);
}

async function createAcademicYear(data = {}) {
    const yearLabel = String(data.year_label || "").trim();
    const startDate = String(data.start_date || "").trim();
    const endDate = String(data.end_date || "").trim();
    if (!yearLabel || yearLabel.length > 20) {
        throw new Error("Jaza jina la academic year (lisizidi herufi 20).");
    }
    if ((startDate && !endDate) || (!startDate && endDate)) {
        throw new Error("Jaza tarehe ya kuanza na kumaliza pamoja, au acha zote wazi.");
    }
    if (startDate && (!isValidDate(startDate) ||
        !isValidDate(endDate) ||
        new Date(`${startDate}T00:00:00Z`) > new Date(`${endDate}T00:00:00Z`))) {
        throw new Error("Tarehe za academic year si sahihi.");
    }
    return promotionModel.createAcademicYear({
        year_label: yearLabel,
        start_date: startDate || null,
        end_date: endDate || null
    });
}

function validateClassIds(sourceClassId, targetClassId) {
    const sourceId = Number(sourceClassId);
    const targetId = Number(targetClassId);
    if (!Number.isInteger(sourceId) || sourceId < 1 ||
        !Number.isInteger(targetId) || targetId < 1 ||
        sourceId === targetId) {
        throw new Error("Chagua darasa la sasa na darasa tofauti la mwaka mpya.");
    }
    return { sourceId, targetId };
}

async function getPreview(sourceClassId, targetClassId) {
    const ids = validateClassIds(sourceClassId, targetClassId);
    const preview = await promotionModel.getPromotionPreview(ids.sourceId, ids.targetId);
    for (const student of preview.students) {
        const scienceSubjects = await studentModel.getStudentScienceSubjects(student.id, ids.sourceId);
        await studentService.getClassSubjectOptions(
            ids.targetId,
            student.academic_stream,
            student.islamic_studies,
            scienceSubjects
        );
    }
    return preview;
}

async function promote(sourceClassId, targetClassId) {
    const ids = validateClassIds(sourceClassId, targetClassId);
    const preview = await promotionModel.getPromotionPreview(ids.sourceId, ids.targetId);
    const students = [];

    for (const student of preview.students) {
        const scienceSubjects = await studentModel.getStudentScienceSubjects(
            student.id,
            ids.sourceId
        );
        const subjectPlan = await studentService.getClassSubjectOptions(
            ids.targetId,
            student.academic_stream,
            student.islamic_studies,
            scienceSubjects
        );
        students.push({
            student_id: Number(student.id),
            subject_ids: subjectPlan.subjects.map((subject) => Number(subject.id)),
            academic_stream: subjectPlan.academic_stream,
            islamic_studies: subjectPlan.islamic_studies
        });
    }

    return promotionModel.promoteStudents(ids.sourceId, ids.targetId, students);
}

module.exports = { activateAcademicYear, createAcademicYear, getOptions, getPreview, promote };
