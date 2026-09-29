"use strict";

const db = require("../config/database");

async function getReportOptions() {
    const academicYearsQuery =
        "SELECT id, year_label, start_date, end_date, status " +
        "FROM academic_years " +
        "WHERE status IN ('ACTIVE', 'CLOSED') " +
        "ORDER BY year_label DESC";

    const examinationsQuery =
        "SELECT e.id, e.academic_year_id, e.exam_name, " +
        "e.exam_type, e.term, e.start_date, e.end_date, " +
        "e.status, ay.year_label " +
        "FROM examinations e " +
        "INNER JOIN academic_years ay " +
        "ON ay.id = e.academic_year_id " +
        "WHERE e.status IN ('OPEN', 'CLOSED') " +
        "ORDER BY ay.year_label DESC, e.start_date DESC, e.id DESC";

    const formsQuery =
        "SELECT id, form_name, status " +
        "FROM forms " +
        "WHERE status = 'ACTIVE' " +
        "ORDER BY form_name ASC";

    const classesQuery =
        "SELECT c.id, c.form_id, c.academic_year_id, " +
        "c.class_name, c.capacity, c.status, " +
        "f.form_name, ay.year_label " +
        "FROM classes c " +
        "INNER JOIN forms f ON f.id = c.form_id " +
        "INNER JOIN academic_years ay " +
        "ON ay.id = c.academic_year_id " +
        "WHERE c.status = 'ACTIVE' " +
        "ORDER BY ay.year_label DESC, " +
        "f.form_name ASC, c.class_name ASC";

    const studentsQuery =
        "SELECT s.id, s.admission_number, s.first_name, " +
        "s.middle_name, s.last_name, s.gender, s.class_id, " +
        "c.class_name, c.form_id, c.academic_year_id, " +
        "f.form_name, ay.year_label " +
        "FROM students s " +
        "INNER JOIN classes c ON c.id = s.class_id " +
        "INNER JOIN forms f ON f.id = c.form_id " +
        "INNER JOIN academic_years ay ON ay.id = c.academic_year_id " +
        "WHERE s.status = 'ACTIVE' " +
        "ORDER BY s.first_name ASC, s.middle_name ASC, s.last_name ASC";

    const subjectsQuery =
        "SELECT id, subject_code, subject_name, status " +
        "FROM subjects " +
        "WHERE status = 'ACTIVE' " +
        "ORDER BY subject_name ASC";

    const [academicYearsResult] = await db.query(academicYearsQuery);
    const [examinationsResult] = await db.query(examinationsQuery);
    const [formsResult] = await db.query(formsQuery);
    const [classesResult] = await db.query(classesQuery);
    const [studentsResult] = await db.query(studentsQuery);
    const [subjectsResult] = await db.query(subjectsQuery);

    return {
        academic_years: academicYearsResult,
        examinations: examinationsResult,
        forms: formsResult,
        classes: classesResult,
        students: studentsResult,
        subjects: subjectsResult
    };
}

async function getSchoolInformation() {
    const query =
        "SELECT ss.id, ss.school_name, ss.po_box, " +
        "ss.motto, ss.head_of_school, " +
        "ss.academic_master_user_id, ss.phone, " +
        "ss.email, ss.logo_path, " +
        "u.username AS academic_master_username " +
        "FROM school_settings ss " +
        "LEFT JOIN users u ON u.id = ss.academic_master_user_id " +
        "WHERE ss.status = 'ACTIVE' " +
        "ORDER BY ss.id ASC LIMIT 1";

    const [rows] = await db.query(query);

    if (!rows.length) {
        return {
            school_name: "MSONGOLA SECONDARY SCHOOL",
            po_box: "P.O BOX 104727",
            motto: "EDUCATION IS LIGHT",
            head_of_school: "NASSORO SHEKULAMBA",
            academic_master: "Mwalimu KIIZA",
            phone: "",
            email: "",
            logo_path: ""
        };
    }

    const school = rows[0];

    return {
        school_name: school.school_name || "MSONGOLA SECONDARY SCHOOL",
        po_box: school.po_box || "P.O BOX 104727",
        motto: school.motto || "EDUCATION IS LIGHT",
        head_of_school: school.head_of_school || "NASSORO SHEKULAMBA",
        academic_master: school.academic_master_username || "Mwalimu KIIZA",
        phone: school.phone || "",
        email: school.email || "",
        logo_path: school.logo_path || ""
    };
}

async function getExamination(examinationId) {
    const query =
        "SELECT e.id, e.academic_year_id, " +
        "e.exam_name, e.exam_type, e.term, " +
        "e.start_date, e.end_date, e.status, " +
        "ay.year_label " +
        "FROM examinations e " +
        "INNER JOIN academic_years ay ON ay.id = e.academic_year_id " +
        "WHERE e.id = ? LIMIT 1";

    const [rows] = await db.query(query, [examinationId]);
    return rows.length ? rows[0] : null;
}

async function getClassInformation(classId) {
    const query =
        "SELECT c.id, c.form_id, c.academic_year_id, " +
        "c.class_name, c.capacity, c.status, " +
        "f.form_name, ay.year_label " +
        "FROM classes c " +
        "INNER JOIN forms f ON f.id = c.form_id " +
        "INNER JOIN academic_years ay ON ay.id = c.academic_year_id " +
        "WHERE c.id = ? LIMIT 1";

    const [rows] = await db.query(query, [classId]);
    return rows.length ? rows[0] : null;
}

async function getStudentInformation(studentId) {
    const query =
        "SELECT s.id, s.admission_number, s.first_name, s.middle_name, s.last_name, " +
        "s.class_id, s.status, c.class_name, c.form_id, c.academic_year_id, " +
        "f.form_name, ay.year_label " +
        "FROM students s " +
        "INNER JOIN classes c ON c.id = s.class_id " +
        "INNER JOIN forms f ON f.id = c.form_id " +
        "INNER JOIN academic_years ay ON ay.id = c.academic_year_id " +
        "WHERE s.id = ? LIMIT 1";

    const [rows] = await db.query(query, [studentId]);
    return rows.length ? rows[0] : null;
}

async function getClassTeacher(classId, academicYearId) {
    const query =
        "SELECT cta.id, cta.teacher_id, cta.class_id, cta.academic_year_id, " +
        "t.teacher_number, t.first_name, t.middle_name, t.last_name, u.username " +
        "FROM class_teachers cta " +
        "INNER JOIN teachers t ON t.id = cta.teacher_id " +
        "LEFT JOIN users u ON u.id = t.user_id " +
        "WHERE cta.class_id = ? " +
        "AND cta.academic_year_id = ? " +
        "AND cta.status = 'ACTIVE' " +
        "AND t.status = 'ACTIVE' " +
        "ORDER BY cta.id DESC LIMIT 1";

    const [rows] = await db.query(query, [classId, academicYearId]);

    if (!rows.length) {
        return {
            teacher_id: null,
            teacher_number: "",
            full_name: "Not Assigned"
        };
    }

    const teacher = rows[0];
    const fullName = [teacher.first_name, teacher.middle_name, teacher.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

    return {
        teacher_id: teacher.teacher_id,
        teacher_number: teacher.teacher_number || "",
        full_name: fullName || teacher.username || "Not Assigned"
    };
}

async function getApprovedMarks(filters) {
    const conditions = [
        "m.status = 'APPROVED'",
        "m.examination_id = ?",
        "m.id = (SELECT MAX(latest_mark.id) FROM marks latest_mark " +
            "WHERE latest_mark.teacher_assignment_id = m.teacher_assignment_id " +
            "AND latest_mark.student_id = m.student_id " +
            "AND latest_mark.examination_id = m.examination_id)"
    ];

    const params = [filters.examination_id];

    if (filters.student_id) {
        conditions.push("s.id = ?");
        params.push(filters.student_id);
    } else {
        conditions.push("s.class_id = ?");
        params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
        conditions.push("c.academic_year_id = ?");
        params.push(filters.academic_year_id);
    }

    if (filters.form_id) {
        conditions.push("c.form_id = ?");
        params.push(filters.form_id);
    }

    if (filters.subject_id && filters.report_type === "subject") {
        conditions.push("m.subject_id = ?");
        params.push(filters.subject_id);
    }

    const query =
        "SELECT m.id AS mark_id, " +
        "m.student_id, m.subject_id, m.examination_id, m.teacher_assignment_id, " +
        "m.mark, m.grade, m.points, m.status, " +
        "s.admission_number, s.first_name, s.middle_name, s.last_name, s.gender, " +
        "c.id AS class_id, c.class_name, c.form_id, c.academic_year_id, " +
        "f.form_name, ay.year_label, " +
        "sub.subject_code, sub.subject_name " +
        "FROM marks m " +
        "INNER JOIN students s ON s.id = m.student_id " +
        "INNER JOIN classes c ON c.id = s.class_id " +
        "INNER JOIN forms f ON f.id = c.form_id " +
        "INNER JOIN academic_years ay ON ay.id = c.academic_year_id " +
        "INNER JOIN subjects sub ON sub.id = m.subject_id " +
        "WHERE " + conditions.join(" AND ") +
        " ORDER BY s.first_name ASC, s.middle_name ASC, s.last_name ASC, sub.subject_name ASC";

    const [rows] = await db.query(query, params);
    return rows;
}

async function validateClassReportReadiness(classInfo, examinationId) {
    const [assignments] = await db.query(`
        SELECT ta.id, subject.subject_name,
               (
                   SELECT submission.status
                   FROM mark_submissions submission
                   WHERE submission.teacher_assignment_id = ta.id
                     AND submission.examination_id = ?
                   ORDER BY submission.id DESC
                   LIMIT 1
               ) AS submission_status
        FROM teacher_assignments ta
        INNER JOIN subjects subject ON subject.id = ta.subject_id
        WHERE ta.class_id = ?
          AND ta.academic_year_id = ?
          AND ta.status = 'ACTIVE'
        ORDER BY subject.subject_name
    `, [examinationId, classInfo.id, classInfo.academic_year_id]);

    if (!assignments.length) {
        throw new Error("Darasa hili halina masomo yenye walimu waliopangiwa.");
    }

    const incompleteAssignments = assignments.filter((assignment) => assignment.submission_status !== "APPROVED");
    if (incompleteAssignments.length) {
        const pendingSubjects = incompleteAssignments
            .map((assignment) => `${assignment.subject_name} (${assignment.submission_status || "HAIJATUMWA"})`)
            .join(", ");
        throw new Error(`Ripoti ya darasa itapatikana baada ya alama zote kuidhinishwa. Bado: ${pendingSubjects}.`);
    }

    const [missingMarks] = await db.query(`
        SELECT st.id AS student_id,
               CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
               subject.subject_name
        FROM students st
        INNER JOIN teacher_assignments ta
            ON ta.class_id = st.class_id
           AND ta.academic_year_id = ?
           AND ta.status = 'ACTIVE'
        INNER JOIN subjects subject ON subject.id = ta.subject_id
        WHERE st.class_id = ?
          AND st.status = 'ACTIVE'
          AND NOT EXISTS (
              SELECT 1
              FROM marks latest_mark
              WHERE latest_mark.teacher_assignment_id = ta.id
                AND latest_mark.student_id = st.id
                AND latest_mark.examination_id = ?
                AND latest_mark.status = 'APPROVED'
                AND latest_mark.id = (
                    SELECT MAX(candidate_mark.id)
                    FROM marks candidate_mark
                    WHERE candidate_mark.teacher_assignment_id = ta.id
                      AND candidate_mark.student_id = st.id
                      AND candidate_mark.examination_id = latest_mark.examination_id
                )
          )
        ORDER BY st.last_name, st.first_name, subject.subject_name
        LIMIT 10
    `, [classInfo.academic_year_id, classInfo.id, examinationId]);

    if (missingMarks.length) {
        const missingEntries = missingMarks
            .map((entry) => `${entry.student_name} - ${entry.subject_name}`)
            .join(", ");
        throw new Error(`Ripoti haijatayarishwa. Alama zilizoidhinishwa hazijakamilika kwa: ${missingEntries}.`);
    }
}

function calculateGrade(mark) {
    const value = Number(mark);

    if (value >= 75) return "A";
    if (value >= 65) return "B";
    if (value >= 45) return "C";
    if (value >= 30) return "D";
    return "F";
}

function calculatePoints(grade) {
    const points = { A: 1, B: 2, C: 3, D: 4, F: 5 };
    return points[grade] || 5;
}

function calculateDivision(totalPoints) {
    const points = Number(totalPoints);

    if (points >= 7 && points <= 17) return "I";
    if (points >= 18 && points <= 21) return "II";
    if (points >= 22 && points <= 25) return "III";
    if (points >= 26 && points <= 32) return "IV";
    return "N/A";
}

function divisionOrder(division) {
    const order = { I: 1, II: 2, III: 3, IV: 4, "N/A": 5 };
    return order[division] || 5;
}

function buildStudentResults(marks) {
    const studentsMap = new Map();

    for (const mark of marks) {
        if (!studentsMap.has(mark.student_id)) {
            studentsMap.set(mark.student_id, {
                student_id: mark.student_id,
                admission_number: mark.admission_number,
                first_name: mark.first_name,
                middle_name: mark.middle_name,
                last_name: mark.last_name,
                full_name: [mark.first_name, mark.middle_name, mark.last_name]
                    .filter(Boolean)
                    .join(" ")
                    .trim(),
                gender: mark.gender,
                class_id: mark.class_id,
                class_name: mark.class_name,
                form_id: mark.form_id,
                form_name: mark.form_name,
                academic_year_id: mark.academic_year_id,
                year_label: mark.year_label,
                subjects: [],
                total_marks: 0,
                average_marks: 0,
                total_points: 0,
                division: "N/A",
                position: null,
                status: "APPROVED"
            });
        }

        const student = studentsMap.get(mark.student_id);
        const marksValue = Number(mark.mark);
        const grade = mark.grade || calculateGrade(marksValue);
        const points = mark.points !== null && mark.points !== undefined
            ? Number(mark.points)
            : calculatePoints(grade);

        student.subjects.push({
            subject_id: mark.subject_id,
            subject_code: mark.subject_code,
            subject_name: mark.subject_name,
            marks: marksValue,
            grade,
            points
        });

        student.total_marks += marksValue;
        student.total_points += points;
    }

    const students = Array.from(studentsMap.values());

    for (const student of students) {
        const subjectCount = student.subjects.length;
        student.average_marks = subjectCount > 0
            ? Number((student.total_marks / subjectCount).toFixed(2))
            : 0;
        student.total_points = Number(student.total_points);
        student.division = calculateDivision(student.total_points);
    }

    return students;
}

function calculatePositions(students) {
    const sorted = [...students].sort((a, b) => {
        const divisionA = divisionOrder(a.division);
        const divisionB = divisionOrder(b.division);

        if (divisionA !== divisionB) {
            return divisionA - divisionB;
        }

        if (a.total_points !== b.total_points) {
            return a.total_points - b.total_points;
        }

        return a.student_id - b.student_id;
    });

    let previousDivision = null;
    let previousPoints = null;
    let previousPosition = 0;

    sorted.forEach((student, index) => {
        const sameResult = student.division === previousDivision && student.total_points === previousPoints;

        if (sameResult) {
            student.position = previousPosition;
        } else {
            student.position = index + 1;
            previousPosition = student.position;
        }

        previousDivision = student.division;
        previousPoints = student.total_points;
    });

    return sorted;
}

async function generateReport(filters = {}) {
    if (!filters.examination_id) {
        throw new Error("Examination ID inahitajika.");
    }

    if (!filters.student_id && !filters.class_id) {
        throw new Error("Class ID au Student ID inahitajika.");
    }

    const examination = await getExamination(filters.examination_id);
    if (!examination) {
        throw new Error("Examination haijapatikana.");
    }

    let classInfo = null;

    if (filters.class_id) {
        classInfo = await getClassInformation(filters.class_id);
        if (!classInfo) {
            throw new Error("Class haijapatikana.");
        }
    } else if (filters.student_id) {
        const studentInfo = await getStudentInformation(filters.student_id);
        if (!studentInfo) {
            throw new Error("Mwanafunzi haijapatikana.");
        }

        classInfo = {
            id: studentInfo.class_id,
            form_id: studentInfo.form_id,
            academic_year_id: studentInfo.academic_year_id,
            class_name: studentInfo.class_name,
            form_name: studentInfo.form_name,
            year_label: studentInfo.year_label
        };
    }

    if (classInfo && filters.academic_year_id && Number(filters.academic_year_id) !== Number(classInfo.academic_year_id)) {
        throw new Error("Academic Year uliyochagua haiendani na class uliyochagua.");
    }

    if (classInfo && Number(examination.academic_year_id) !== Number(classInfo.academic_year_id)) {
        throw new Error("Examination na class lazima viwe vya Academic Year moja.");
    }

    if (classInfo && filters.form_id && Number(filters.form_id) !== Number(classInfo.form_id)) {
        throw new Error("Form uliyochagua haiendani na class uliyochagua.");
    }

    const isClassReport = !filters.student_id && filters.report_type !== "student" && filters.report_type !== "subject";
    if (classInfo && isClassReport) {
        await validateClassReportReadiness(classInfo, filters.examination_id);
    }

    const school = await getSchoolInformation();
    const classTeacher = classInfo
        ? await getClassTeacher(classInfo.id, classInfo.academic_year_id)
        : { teacher_id: null, teacher_number: "", full_name: "Not Assigned" };
    const marks = await getApprovedMarks(filters);
    const students = calculatePositions(buildStudentResults(marks));
    const subjectMap = new Map();

    for (const mark of marks) {
        const subjectId = Number(mark.subject_id);
        if (!subjectMap.has(subjectId)) {
            subjectMap.set(subjectId, {
                subject_id: subjectId,
                subject_code: mark.subject_code,
                subject_name: mark.subject_name,
                students: 0,
                total_marks: 0,
                average_marks: 0
            });
        }

        const subject = subjectMap.get(subjectId);
        subject.students += 1;
        subject.total_marks += Number(mark.mark);
    }

    const subjectSummary = Array.from(subjectMap.values());
    for (const subject of subjectSummary) {
        subject.average_marks = subject.students > 0
            ? Number((subject.total_marks / subject.students).toFixed(2))
            : 0;
        subject.total_marks = Number(subject.total_marks.toFixed(2));
    }

    const totalMarks = students.reduce((total, student) => total + Number(student.total_marks), 0);
    const totalPoints = students.reduce((total, student) => total + Number(student.total_points), 0);
    const overallAverage = students.length > 0
        ? Number((students.reduce((total, student) => total + Number(student.average_marks), 0) / students.length).toFixed(2))
        : 0;

    return {
        school,
        examination: {
            id: examination.id,
            name: examination.exam_name,
            type: examination.exam_type,
            term: examination.term,
            status: examination.status,
            academic_year_id: examination.academic_year_id,
            year_label: examination.year_label
        },
        class: classInfo ? {
            id: classInfo.id,
            name: classInfo.class_name,
            form_id: classInfo.form_id,
            form_name: classInfo.form_name,
            academic_year_id: classInfo.academic_year_id,
            year_label: classInfo.year_label
        } : null,
        class_teacher: classTeacher,
        students,
        subject_summary: subjectSummary,
        summary: {
            students: students.length,
            average: overallAverage,
            total_points: totalPoints,
            total_marks: Number(totalMarks.toFixed(2)),
            approved: students.length
        },
        report_type: filters.report_type || (filters.student_id ? "student" : "class")
    };
}

module.exports = {
    getReportOptions,
    getSchoolInformation,
    getExamination,
    getClassInformation,
    getClassTeacher,
    getApprovedMarks,
    calculateGrade,
    calculatePoints,
    calculateDivision,
    divisionOrder,
    buildStudentResults,
    calculatePositions,
    generateReport
};
