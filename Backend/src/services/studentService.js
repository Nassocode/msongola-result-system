const studentModel = require("../models/Student");

const CORE_SUBJECTS = [
    "HISTORY",
    "KISWAHILI",
    "GEOGRAPHY",
    "ENGLISH",
    "CIVICS",
    "BASIC MATHEMATICS",
    "LITERATURE IN ENGLISH"
];
const ISLAMIC_SUBJECT_NAMES = [
    "ISLAMICKNOWLEDGE",
    "ELIMUYADINIYAKIISLAMUEDK"
];
const JUNIOR_ARTS_SUBJECTS = [
    "MATHEMATICS",
    "GEOGRAPHY",
    "HISTORY",
    "BIOLOGY",
    "KISWAHILI",
    "ENGLISH",
    "HISTORIA YA TANZANIA NA MAADILI",
    "BUSINESS STUDIES"
];
const JUNIOR_SCIENCE_SUBJECTS = [
    ...JUNIOR_ARTS_SUBJECTS,
    "PHYSICS",
    "CHEMISTRY"
];

function normalizeSubjectName(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeScienceSubjects(value) {
    const values = Array.isArray(value)
        ? value
        : value === undefined || value === null || value === ""
            ? []
            : String(value).split(",");
    const subjects = [...new Set(values.map((subject) => normalizeSubjectName(subject)))];
    if (subjects.some((subject) => !["PHYSICS", "CHEMISTRY"].includes(subject))) {
        throw new Error("Chagua Physics au Chemistry pekee kwa mwanafunzi wa Science.");
    }
    return subjects;
}

function normalizeEnrollmentOptions(formNumber, streamValue, islamicValue, scienceSubjectsValue) {
    const stream = String(streamValue || "GENERAL").trim().toUpperCase();
    const islamicStudies = islamicValue === true || String(islamicValue).toLowerCase() === "true";
    const hasStreams = [1, 2, 3, 4].includes(Number(formNumber));
    const scienceSubjects = normalizeScienceSubjects(scienceSubjectsValue);
    if (hasStreams && !["ARTS", "SCIENCE"].includes(stream)) {
        throw new Error(`Chagua mkondo wa Arts au Science kwa mwanafunzi wa Form ${formNumber}.`);
    }
    if (!hasStreams && stream !== "GENERAL") {
        throw new Error("Mkondo wa Arts/Science unatumika kwa Form 1 hadi Form 4 pekee.");
    }
    if ([3, 4].includes(Number(formNumber)) && stream === "SCIENCE" && !scienceSubjects.length) {
        throw new Error("Chagua angalau somo moja la sayansi: Physics au Chemistry.");
    }
    return {
        stream: hasStreams ? stream : "GENERAL",
        islamicStudies,
        scienceSubjects
    };
}

async function resolveStudentSubjectPlan(classId, streamValue, islamicValue, scienceSubjectsValue) {
    const profile = await studentModel.getClassSubjectProfile(classId);
    const options = normalizeEnrollmentOptions(profile.form_number, streamValue, islamicValue, scienceSubjectsValue);
    const byName = new Map(profile.subjects.map((subject) => [
        normalizeSubjectName(subject.subject_name),
        subject
    ]));
    const isIslamicSubject = (subject) =>
        ISLAMIC_SUBJECT_NAMES.includes(normalizeSubjectName(subject.subject_name));
    const islamicKey = normalizeSubjectName("Islamic Knowledge");
    const formNumber = Number(profile.form_number);
    const classCode = String(profile.class_name || "").toUpperCase().replace(/\s+/g, "");
    const islamicRequired = [1, 2].includes(formNumber) && !/^FORM[12]A$/.test(classCode);
    let selectedSubjects;

    if ([1, 2].includes(formNumber)) {
        const requiredNames = options.stream === "ARTS"
            ? JUNIOR_ARTS_SUBJECTS
            : JUNIOR_SCIENCE_SUBJECTS;
        const missing = requiredNames.filter((name) => !byName.has(normalizeSubjectName(name)));
        if (missing.length) {
            throw new Error(`Masomo haya hayapo kwenye orodha ya Form ${formNumber}: ${missing.join(", ")}.`);
        }
        selectedSubjects = requiredNames.map((name) => byName.get(normalizeSubjectName(name)));
    } else if ([3, 4].includes(formNumber)) {
        const requiredNames = [...CORE_SUBJECTS];
        if (options.stream === "ARTS") requiredNames.push("BIOLOGY");
        else requiredNames.push("BIOLOGY", ...options.scienceSubjects);

        const missing = requiredNames.filter((name) => !byName.has(normalizeSubjectName(name)));
        if (missing.length) {
            throw new Error(`Masomo haya hayapo kwenye orodha ya Form ${formNumber}: ${missing.join(", ")}.`);
        }
        selectedSubjects = requiredNames.map((name) => byName.get(normalizeSubjectName(name)));
    } else {
        selectedSubjects = profile.subjects.filter((subject) => !isIslamicSubject(subject));
        if (!selectedSubjects.length) {
            throw new Error("Hakuna masomo yaliyowekwa kwa kidato hiki.");
        }
    }

    if (islamicRequired || ([3, 4].includes(formNumber) && options.islamicStudies)) {
        const islamicSubject = profile.subjects.find(isIslamicSubject)
            || byName.get(islamicKey);
        if (!islamicSubject) {
            throw new Error("Somo la Elimu ya Dini ya Kiislamu (E.D.K) halipo kwenye masomo ya darasa hili.");
        }
        selectedSubjects.push(islamicSubject);
    }

    return {
        academic_stream: options.stream,
        islamic_studies: islamicRequired || ([3, 4].includes(formNumber) && options.islamicStudies),
        subject_ids: [...new Set(selectedSubjects.map((subject) => Number(subject.id)))]
    };
}

async function buildStudentResponse(student, includeSubjectIds = false) {
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
        academic_stream: student.academic_stream || "GENERAL",
        islamic_studies: Boolean(student.islamic_studies),
        science_subjects: includeSubjectIds && student.class_id
            ? await studentModel.getStudentScienceSubjects(student.id, student.class_id)
            : [],
        subject_ids: includeSubjectIds && student.class_id
            ? await studentModel.getStudentSubjectIds(student.id, student.class_id)
            : [],
        class_id: student.class_id ? Number(student.class_id) : null,
        class_name: student.class_name,
        form_name: student.form_name,
        form_number: student.form_number,
        academic_year: student.academic_year
    };
}

async function listStudents() {
    const students = await studentModel.getStudents();
    return Promise.all(students.map((student) => buildStudentResponse(student)));
}

async function getStudentById(id) {
    const student = await studentModel.getStudentById(id);

    if (!student) {
        throw new Error("Mwanafunzi hakupatikana");
    }

    return buildStudentResponse(student, true);
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
    const subjectPlan = await resolveStudentSubjectPlan(
        matchedClass.id,
        data.academic_stream,
        data.islamic_studies,
        data.science_subjects
    );

    const studentId = await studentModel.createStudent({
        first_name: firstName,
        middle_name: data.middle_name || null,
        last_name: lastName,
        gender,
        date_of_birth: data.date_of_birth || null,
        class_id: matchedClass.id,
        ...subjectPlan,
        admission_date: data.admission_date || null,
        status
    });

    const createdStudent = await studentModel.getStudentById(studentId);
    return buildStudentResponse(createdStudent, true);
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
    const subjectPlan = await resolveStudentSubjectPlan(
        matchedClass.id,
        data.academic_stream,
        data.islamic_studies,
        data.science_subjects
    );

    await studentModel.updateStudent(studentId, {
        admission_number: current.admission_number,
        first_name: firstName,
        middle_name: String(data.middle_name || "").trim() || null,
        last_name: lastName,
        gender,
        date_of_birth: data.date_of_birth || null,
        class_id: matchedClass.id,
        ...subjectPlan,
        admission_date: data.admission_date || null,
        status
    });
    return buildStudentResponse(await studentModel.getStudentById(studentId), true);
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

async function getClassOptions(academicYear, formNumber) {
    const parsedForm = formNumber ? Number(formNumber) : null;
    if (parsedForm !== null && (!Number.isInteger(parsedForm) || parsedForm < 1 || parsedForm > 6)) {
        throw new Error("Kidato si sahihi.");
    }
    return studentModel.getClassOptions(academicYear, parsedForm);
}

async function getClassSubjectOptions(classId, stream, islamicStudies, scienceSubjects) {
    const id = Number(classId);
    if (!Number.isInteger(id) || id < 1) throw new Error("Class ID si sahihi.");
    const profile = await studentModel.getClassSubjectProfile(id);
    const subjectPlan = await resolveStudentSubjectPlan(id, stream, islamicStudies, scienceSubjects);
    const subjectIds = new Set(subjectPlan.subject_ids);
    return {
        form_number: Number(profile.form_number),
        academic_stream: subjectPlan.academic_stream,
        islamic_studies: subjectPlan.islamic_studies,
        subjects: profile.subjects.filter((subject) => subjectIds.has(Number(subject.id)))
    };
}

module.exports = {
    listStudents,
    getStudentById,
    createStudent,
    updateStudent,
    updateStudentStatus,
    getClassOptions,
    getClassSubjectOptions
};
