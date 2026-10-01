const studentModel = require("../models/Student");

function buildStudentResponse(student) {
    if (!student) {
        return null;
    }

    return {
        id: Number(student.id),
        admission_number: student.admission_number,
        first_name: student.first_name,
        middle_name: student.middle_name,
        last_name: student.last_name,
        full_name: [
            student.first_name,
            student.middle_name,
            student.last_name
        ].filter(Boolean).join(" "),
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        admission_date: student.admission_date,
        status: student.status,
        class_id: student.class_id ? Number(student.class_id) : null,
        class_name: student.class_name,
        form_name: student.form_name,
        form_number: student.form_number,
        academic_year: student.academic_year
    };
}

async function listStudents() {
    const students = await studentModel.getStudents();
    return students.map(buildStudentResponse);
}

async function getStudentById(id) {
    const student = await studentModel.getStudentById(id);

    if (!student) {
        throw new Error("Mwanafunzi hakupatikana");
    }

    return buildStudentResponse(student);
}

async function createStudent(data) {
    const firstName = String(data.first_name || "").trim();
    const lastName = String(data.last_name || "").trim();
    const gender = String(data.gender || "").trim().toUpperCase();
    const academicYear = String(data.academic_year || "").trim();
    const className = String(data.class_name || "").trim();
    const classId = Number(data.class_id);
    const status = String(data.status || "ACTIVE").trim().toUpperCase();

    if (!firstName) {
        throw new Error("Jina la kwanza linahitajika");
    }

    if (!lastName) {
        throw new Error("Jina la mwisho linahitajika");
    }

    if (!gender || !["MALE", "FEMALE"].includes(gender)) {
        throw new Error("Jinsia sio sahihi");
    }

    if (!academicYear) {
        throw new Error("Academic Year inahitajika");
    }

    if (!className && !(Number.isInteger(classId) && classId > 0)) {
        throw new Error("Darasa linahitajika");
    }

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        throw new Error("Status ya mwanafunzi sio sahihi");
    }

    const matchedClass = Number.isInteger(classId) && classId > 0
        ? await studentModel.findClassById(classId, academicYear)
        : await studentModel.findClassByName(className, academicYear);
    if (!matchedClass) {
        throw new Error("Darasa lililochaguliwa halijapatikana kwa mwaka uliochaguliwa");
    }

    const studentId = await studentModel.createStudent({
        first_name: firstName,
        middle_name: data.middle_name || null,
        last_name: lastName,
        gender,
        date_of_birth: data.date_of_birth || null,
        class_id: matchedClass.id,
        admission_date: data.admission_date || null,
        status
    });

    const createdStudent = await studentModel.getStudentById(studentId);
    return buildStudentResponse(createdStudent);
}

async function updateStudent(id, data) {
    const studentId = Number(id);
    if (!Number.isInteger(studentId) || studentId < 1) throw new Error("Mwanafunzi ID si sahihi");
    const current = await studentModel.getStudentById(studentId);
    if (!current) throw new Error("Mwanafunzi hakupatikana");

    const firstName = String(data.first_name || "").trim();
    const lastName = String(data.last_name || "").trim();
    const gender = String(data.gender || "").trim().toUpperCase();
    const academicYear = String(data.academic_year || "").trim();
    const className = String(data.class_name || "").trim();
    const classId = Number(data.class_id);
    const status = String(data.status || "ACTIVE").trim().toUpperCase();

    if (!firstName || !lastName || !academicYear || (!className && !(Number.isInteger(classId) && classId > 0))) throw new Error("Jaza taarifa zote zinazohitajika.");
    if (!["MALE", "FEMALE"].includes(gender)) throw new Error("Jinsia sio sahihi");
    if (!["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"].includes(status)) throw new Error("Status ya mwanafunzi sio sahihi");

    const matchedClass = Number.isInteger(classId) && classId > 0
        ? await studentModel.findClassById(classId, academicYear)
        : await studentModel.findClassByName(className, academicYear);
    if (!matchedClass) throw new Error("Darasa halijapatikana kwa mwaka uliochaguliwa.");

    await studentModel.updateStudent(studentId, {
        admission_number: current.admission_number,
        first_name: firstName,
        middle_name: String(data.middle_name || "").trim() || null,
        last_name: lastName,
        gender,
        date_of_birth: data.date_of_birth || null,
        class_id: matchedClass.id,
        admission_date: data.admission_date || null,
        status
    });
    return buildStudentResponse(await studentModel.getStudentById(studentId));
}

async function updateStudentStatus(id, status) {
    const studentId = Number(id);
    const normalizedStatus = String(status || "").trim().toUpperCase();
    if (!Number.isInteger(studentId) || studentId < 1) throw new Error("Mwanafunzi ID si sahihi");
    if (!["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED"].includes(normalizedStatus)) throw new Error("Status ya mwanafunzi sio sahihi");
    const student = await studentModel.getStudentById(studentId);
    if (!student) throw new Error("Mwanafunzi hakupatikana");
    await studentModel.updateStudentStatus(studentId, normalizedStatus);
    return buildStudentResponse(await studentModel.getStudentById(studentId));
}

async function getClassOptions() {
    return await studentModel.getClassOptions();
}

module.exports = {
    listStudents,
    getStudentById,
    createStudent,
    updateStudent,
    updateStudentStatus,
    getClassOptions
};
