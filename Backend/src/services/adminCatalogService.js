const catalogModel = require("../models/adminCatalogModel");

function required(value, label) {
    const clean = String(value || "").trim();
    if (!clean) throw new Error(`${label} inahitajika`);
    return clean;
}

async function getTeachers() {
    return catalogModel.getTeachers();
}

async function getTeacherUserOptions() {
    return catalogModel.getTeacherUserOptions();
}

async function createTeacher(data) {
    const userId = Number(data.user_id);
    if (!Number.isInteger(userId)) throw new Error("Subject Teacher account inahitajika");
    const teacherNumber = required(data.teacher_number, "Teacher number").toUpperCase();
    const firstName = required(data.first_name, "First name");
    const lastName = required(data.last_name, "Last name");
    const status = String(data.status || "ACTIVE").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new Error("Status sio sahihi");
    const id = await catalogModel.createTeacher({ ...data, user_id: userId, teacher_number: teacherNumber, first_name: firstName, last_name: lastName, status });
    return { id, user_id: userId, teacher_number: teacherNumber, first_name: firstName, last_name: lastName, status };
}

async function getSubjects() {
    return catalogModel.getSubjects();
}

async function createSubject(data) {
    const subjectCode = required(data.subject_code, "Subject code").toUpperCase();
    const subjectName = required(data.subject_name, "Subject name");
    const status = String(data.status || "ACTIVE").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new Error("Status sio sahihi");
    const id = await catalogModel.createSubject({ subject_code: subjectCode, subject_name: subjectName, status });
    return { id, subject_code: subjectCode, subject_name: subjectName, status };
}

async function getClasses() {
    return catalogModel.getClasses();
}

async function getClassOptions() {
    return catalogModel.getClassOptions();
}

async function createClass(data) {
    const formId = Number(data.form_id);
    const yearId = Number(data.academic_year_id);
    if (!Number.isInteger(formId) || !Number.isInteger(yearId)) throw new Error("Form na academic year vinahitajika");
    const className = required(data.class_name, "Class name").toUpperCase();
    const capacity = data.capacity === "" || data.capacity === undefined ? null : Number(data.capacity);
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) throw new Error("Capacity sio sahihi");
    const status = String(data.status || "ACTIVE").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new Error("Status sio sahihi");
    const id = await catalogModel.createClass({ form_id: formId, academic_year_id: yearId, class_name: className, capacity, status });
    return { id, class_name: className, capacity, status, form_id: formId, academic_year_id: yearId };
}

async function getAssignments() { return catalogModel.getAssignments(); }
async function getAssignmentOptions() { return catalogModel.getAssignmentOptions(); }
async function createAssignment(data) {
    const ids = ["teacher_id", "class_id", "subject_id", "academic_year_id"].map((key) => Number(data[key]));
    if (ids.some((id) => !Number.isInteger(id) || id < 1)) throw new Error("Teacher, class, subject na academic year vinahitajika");
    const status = String(data.status || "ACTIVE").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new Error("Status sio sahihi");
    const id = await catalogModel.createAssignment({ teacher_id: ids[0], class_id: ids[1], subject_id: ids[2], academic_year_id: ids[3], status });
    return { id, status };
}

async function getClassTeachers() { return catalogModel.getClassTeachers(); }
async function getClassTeacherOptions() { return catalogModel.getClassTeacherOptions(); }
async function createClassTeacher(data) {
    const teacherId = Number(data.teacher_id);
    const classId = Number(data.class_id);
    const academicYearId = Number(data.academic_year_id);
    if (![teacherId, classId, academicYearId].every((value) => Number.isInteger(value) && value > 0)) {
        throw new Error("Mwalimu, darasa na mwaka wa masomo vinahitajika.");
    }
    const id = await catalogModel.createClassTeacher({
        teacher_id: teacherId,
        class_id: classId,
        academic_year_id: academicYearId
    });
    return { id, teacher_id: teacherId, class_id: classId, academic_year_id: academicYearId, status: "ACTIVE" };
}

async function getFormCoordinators() { return catalogModel.getFormCoordinators(); }
async function getFormCoordinatorOptions() { return catalogModel.getFormCoordinatorOptions(); }
async function createFormCoordinator(data) {
    const teacherId = Number(data.teacher_id);
    const formId = Number(data.form_id);
    const academicYearId = Number(data.academic_year_id);
    if (![teacherId, formId, academicYearId].every((value) => Number.isInteger(value) && value > 0)) {
        throw new Error("Mwalimu, form na mwaka wa masomo vinahitajika.");
    }
    const id = await catalogModel.createFormCoordinator({
        teacher_id: teacherId,
        form_id: formId,
        academic_year_id: academicYearId
    });
    return { id, teacher_id: teacherId, form_id: formId, academic_year_id: academicYearId, status: "ACTIVE" };
}

async function updateCatalogStatus(resource, rawId, rawStatus) {
    const id = Number(rawId);
    const status = String(rawStatus || "").trim().toUpperCase();
    if (!Number.isInteger(id) || id < 1) throw new Error("ID si sahihi.");
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw new Error("Status si sahihi.");
    const affectedRows = await catalogModel.updateCatalogStatus(resource, id, status);
    if (!affectedRows) throw new Error("Taarifa haijapatikana au haijabadilika.");
    return { id, status };
}

module.exports = { getTeachers, getTeacherUserOptions, createTeacher, getSubjects, createSubject, getClasses, getClassOptions, createClass, getAssignments, getAssignmentOptions, createAssignment, getClassTeachers, getClassTeacherOptions, createClassTeacher, getFormCoordinators, getFormCoordinatorOptions, createFormCoordinator, updateCatalogStatus };
