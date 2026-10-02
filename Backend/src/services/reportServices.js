"use strict";

const db = require("../config/database");

function resolveClassSubjectCatalog(formRows = [], legacyRows = []) {
    const merged = new Map();
    const classesWithFormCatalog = new Set(formRows
        .map((row) => Number(row.class_id ?? row.classId ?? 0))
        .filter(Boolean));

    for (const [rows, isLegacy] of [[formRows, false], [legacyRows, true]]) {
        for (const row of rows) {
            const classId = Number(row.class_id ?? row.classId ?? 0);
            const formId = Number(row.form_id ?? row.formId ?? 0);
            const subjectId = Number(row.subject_id ?? row.id ?? 0);
            if (isLegacy && classesWithFormCatalog.has(classId)) continue;
            if (!classId && !formId) continue;
            if (!subjectId) continue;

            const key = `${classId || formId}:${subjectId}`;
            if (!merged.has(key)) {
                merged.set(key, {
                    class_id: classId || null,
                    form_id: formId || null,
                    academic_year_id: Number(row.academic_year_id ?? row.academicYearId ?? 0) || null,
                    subject_id: subjectId,
                    subject_code: row.subject_code || null,
                    subject_name: row.subject_name || null,
                    is_compulsory: row.is_compulsory ?? true,
                    subject_order: row.subject_order ?? null
                });
            }
        }
    }

    return Array.from(merged.values()).sort((left, right) => {
        const orderA = left.subject_order ?? Number.MAX_SAFE_INTEGER;
        const orderB = right.subject_order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return Number(orderA) - Number(orderB);
        return String(left.subject_name || "").localeCompare(String(right.subject_name || ""));
    });
}

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
        "f.form_name, ay.year_label, " +
        "(SELECT COUNT(*) FROM students active_student " +
        "WHERE active_student.class_id = c.id AND active_student.status = 'ACTIVE') AS student_count " +
        "FROM classes c " +
        "INNER JOIN forms f ON f.id = c.form_id " +
        "INNER JOIN academic_years ay " +
        "ON ay.id = c.academic_year_id " +
        "WHERE c.status = 'ACTIVE' " +
        "ORDER BY ay.year_label DESC, " +
        "f.form_name ASC, c.class_name ASC";

    const formSubjectsQuery =
        "SELECT c.id AS class_id, c.form_id, c.academic_year_id, " +
        "s.id AS subject_id, s.subject_code, s.subject_name, " +
        "fs.is_compulsory, 0 AS subject_order " +
        "FROM classes c " +
        "INNER JOIN form_subjects fs ON fs.form_id = c.form_id AND fs.status = 'ACTIVE' " +
        "INNER JOIN subjects s ON s.id = fs.subject_id AND s.status = 'ACTIVE' " +
        "WHERE c.status = 'ACTIVE' " +
        "ORDER BY c.id, s.subject_name";

    const legacySubjectsQuery =
        "SELECT DISTINCT c.id AS class_id, c.form_id, c.academic_year_id, " +
        "ta.subject_id AS subject_id, s.subject_code, s.subject_name, " +
        "TRUE AS is_compulsory, 0 AS subject_order " +
        "FROM teacher_assignments ta " +
        "INNER JOIN classes c ON c.id = ta.class_id " +
        "INNER JOIN subjects s ON s.id = ta.subject_id " +
        "WHERE ta.status = 'ACTIVE' AND c.status = 'ACTIVE' AND s.status = 'ACTIVE' " +
        "ORDER BY c.id, s.subject_name";

    const [academicYearsResult] = await db.query(academicYearsQuery);
    const [examinationsResult] = await db.query(examinationsQuery);
    const [formsResult] = await db.query(formsQuery);
    const [classesResult] = await db.query(classesQuery);
    const [formSubjectsResult] = await db.query(formSubjectsQuery);
    const [legacySubjectsResult] = await db.query(legacySubjectsQuery);

    return {
        academic_years: academicYearsResult,
        examinations: examinationsResult,
        forms: formsResult,
        classes: classesResult,
        subjects: resolveClassSubjectCatalog(formSubjectsResult, legacySubjectsResult)
    };
}

function requiredReportId(value, label) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
        throw new Error(`${label} si sahihi.`);
    }
    return id;
}

async function getStudentsForClass(filters = {}) {
    const classId = requiredReportId(filters.class_id, "Darasa");
    const academicYearId = requiredReportId(filters.academic_year_id, "Academic Year");
    const formId = requiredReportId(filters.form_id, "Form");
    const classInfo = await getClassInformation(classId);

    if (!classInfo || classInfo.status !== "ACTIVE") throw new Error("Darasa halijapatikana.");
    if (Number(classInfo.academic_year_id) !== academicYearId) throw new Error("Darasa halilingani na Academic Year uliyochagua.");
    if (Number(classInfo.form_id) !== formId) throw new Error("Darasa halilingani na Form uliyochagua.");

    const [rows] = await db.query(`
        SELECT id, admission_number, first_name, middle_name, last_name, gender, class_id
        FROM students
        WHERE class_id = ? AND status = 'ACTIVE'
        ORDER BY last_name, first_name, middle_name, id
    `, [classId]);
    return rows;
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
        "ORDER BY ss.id DESC LIMIT 1";

    const [rows] = await db.query(query);

    if (!rows.length) {
        return {
            school_name: "MSONGOLA SECONDARY SCHOOL",
            po_box: "P.O BOX 104727",
            motto: "EDUCATION IS LIGHT",
            head_of_school: "Not configured",
            academic_master: "Not configured",
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
        head_of_school: school.head_of_school || "Not configured",
        academic_master: school.academic_master_username || "Not configured",
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

function normalizeReportFilters(input = {}) {
    const reportType = String(input.report_type || "").trim().toLowerCase();
    if (!["student", "class", "subject", "summary"].includes(reportType)) {
        throw new Error("Aina ya ripoti si sahihi.");
    }

    const filters = {
        report_type: reportType,
        academic_year_id: requiredReportId(input.academic_year_id, "Academic Year"),
        examination_id: requiredReportId(input.examination_id, "Examination"),
        form_id: requiredReportId(input.form_id, "Form"),
        class_id: requiredReportId(input.class_id, "Darasa"),
        student_id: input.student_id ? requiredReportId(input.student_id, "Mwanafunzi") : null,
        subject_id: input.subject_id ? requiredReportId(input.subject_id, "Somo") : null,
        preview_only: input.preview_only === true || input.preview_only === "true"
    };

    if (reportType === "student" && !filters.student_id) throw new Error("Chagua mwanafunzi kwa ripoti ya mwanafunzi.");
    if (reportType !== "student" && filters.student_id) throw new Error("Ripoti hii haikubali student_id.");
    if (reportType !== "subject" && filters.subject_id) throw new Error("Ripoti hii haikubali subject_id.");
    return filters;
}

async function getStudentInformation(studentId) {
    const query =
        "SELECT s.id, s.admission_number, s.first_name, s.middle_name, s.last_name, s.gender, " +
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

async function getApprovedMarks(filters, classInfo = null) {
    const selectedClass = classInfo || await getClassInformation(filters.class_id);
    if (!selectedClass) throw new Error("Darasa halijapatikana.");
    const classSubjects = await getClassRequiredSubjects(selectedClass);
    if (!classSubjects.length) throw new Error("Darasa hili halina masomo yaliyotangazwa kwa form yake.");
    const allowedSubjectIds = classSubjects.map((subject) => Number(subject.subject_id));
    const conditions = [
        "m.status = 'APPROVED'",
        "s.status = 'ACTIVE'",
        "m.examination_id = ?",
        "m.id = (SELECT MAX(latest_mark.id) FROM marks latest_mark " +
            "WHERE latest_mark.teacher_assignment_id = m.teacher_assignment_id " +
            "AND latest_mark.student_id = m.student_id " +
            "AND latest_mark.examination_id = m.examination_id)"
    ];

    const params = [filters.examination_id];
    conditions.push(`m.subject_id IN (${allowedSubjectIds.map(() => "?").join(", ")})`);
    params.push(...allowedSubjectIds);

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

async function getClassRequiredSubjects(classInfo) {
    const [formSubjects] = await db.query(`
        SELECT fs.subject_id, s.subject_code, s.subject_name, fs.is_compulsory
        FROM form_subjects fs
        INNER JOIN subjects s ON s.id = fs.subject_id
        WHERE fs.form_id = ?
          AND fs.status = 'ACTIVE'
          AND s.status = 'ACTIVE'
        ORDER BY s.subject_name ASC
    `, [classInfo.form_id]);

    if (formSubjects.length) {
        return formSubjects;
    }

    const [assignmentSubjects] = await db.query(`
        SELECT DISTINCT ta.subject_id, s.subject_code, s.subject_name, TRUE AS is_compulsory
        FROM teacher_assignments ta
        INNER JOIN subjects s ON s.id = ta.subject_id
        WHERE ta.class_id = ?
          AND ta.academic_year_id = ?
          AND ta.status = 'ACTIVE'
          AND s.status = 'ACTIVE'
        ORDER BY s.subject_name ASC
    `, [classInfo.id, classInfo.academic_year_id]);

    return assignmentSubjects;
}

async function validateClassReportReadiness(classInfo, examinationId, studentId = null) {
    const requiredSubjects = await getClassRequiredSubjects(classInfo);

    if (!requiredSubjects.length) {
        throw new Error("Darasa hili halina masomo yaliyotangazwa kwa form yake.");
    }

    const subjectIds = requiredSubjects.map((subject) => Number(subject.subject_id));
    const placeholders = subjectIds.map(() => "?").join(", ");

    if (!studentId) {
        const [approvedSubjects] = await db.query(`
            SELECT DISTINCT ta.subject_id, s.subject_name
            FROM teacher_assignments ta
            INNER JOIN subjects s ON s.id = ta.subject_id
            INNER JOIN marks m ON m.teacher_assignment_id = ta.id
            WHERE ta.class_id = ?
              AND ta.academic_year_id = ?
              AND ta.status = 'ACTIVE'
              AND m.examination_id = ?
              AND m.status = 'APPROVED'
              AND ta.subject_id IN (${placeholders})
            ORDER BY s.subject_name ASC
        `, [classInfo.id, classInfo.academic_year_id, examinationId, ...subjectIds]);

        const approvedSet = new Set(approvedSubjects.map((subject) => Number(subject.subject_id)));
        const missingApprovedSubjects = requiredSubjects.filter((subject) => !approvedSet.has(Number(subject.subject_id)));

        if (missingApprovedSubjects.length) {
            const pendingSubjects = missingApprovedSubjects
                .map((subject) => subject.subject_name)
                .join(", ");
            throw new Error(`Ripoti ya darasa itapatikana baada ya alama zote kuidhinishwa. Bado: ${pendingSubjects}.`);
        }
    }

    const studentCondition = studentId ? "AND st.id = ?" : "";
    const missingMarksParams = [classInfo.id, ...subjectIds];
    if (studentId) missingMarksParams.push(studentId);
    missingMarksParams.push(examinationId, classInfo.academic_year_id);
    const [missingMarks] = await db.query(`
        SELECT st.id AS student_id,
               CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
               subject.subject_name
        FROM students st
        CROSS JOIN subjects subject
        WHERE st.class_id = ?
          AND st.status = 'ACTIVE'
          AND subject.status = 'ACTIVE'
          AND subject.id IN (${placeholders})
          ${studentCondition}
          AND NOT EXISTS (
              SELECT 1
              FROM teacher_assignments ta
              INNER JOIN marks approved_mark
                  ON approved_mark.teacher_assignment_id = ta.id
                 AND approved_mark.student_id = st.id
                 AND approved_mark.examination_id = ?
                 AND approved_mark.status = 'APPROVED'
                 AND approved_mark.id = (
                    SELECT MAX(candidate_mark.id)
                    FROM marks candidate_mark
                    WHERE candidate_mark.teacher_assignment_id = approved_mark.teacher_assignment_id
                      AND candidate_mark.student_id = approved_mark.student_id
                      AND candidate_mark.examination_id = approved_mark.examination_id
                )
              WHERE ta.class_id = st.class_id
                AND ta.academic_year_id = ?
                AND ta.status = 'ACTIVE'
                AND ta.subject_id = subject.id
          )
        ORDER BY st.last_name, st.first_name, subject.subject_name
        LIMIT 10
    `, missingMarksParams);

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

function calculateOverallRemark(average) {
    const value = Number(average);
    if (!Number.isFinite(value)) return "Overall average is not available.";
    if (value >= 75) return "Excellent performance";
    if (value >= 65) return "Very good performance";
    if (value >= 45) return "Good performance";
    if (value >= 30) return "Satisfactory performance";
    return "Needs improvement";
}

function calculatePoints(grade) {
    const points = { A: 1, B: 2, C: 3, D: 4, F: 5 };
    return points[grade] || 5;
}

function calculateDivision(totalPoints, subjectCount = 7) {
    if (Number(subjectCount) < 7) return "N/A";

    const points = Number(totalPoints);

    if (points >= 7 && points <= 17) return "I";
    if (points >= 18 && points <= 21) return "II";
    if (points >= 22 && points <= 25) return "III";
    if (points >= 26 && points <= 32) return "IV";
    if (points >= 33 && points <= 35) return "0";
    return "N/A";
}

function divisionOrder(division) {
    const order = { I: 1, II: 2, III: 3, IV: 4, "0": 5, "N/A": 6 };
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
        student.overall_remark = calculateOverallRemark(student.average_marks);
        const bestSeven = [...student.subjects]
            .sort((left, right) => left.points - right.points || right.marks - left.marks)
            .slice(0, 7);
        student.division_subject_count = bestSeven.length;
        student.division_subjects = bestSeven.map((subject) => subject.subject_name);
        student.total_points = bestSeven.reduce((total, subject) => total + Number(subject.points), 0);
        student.division = calculateDivision(student.total_points, bestSeven.length);
    }

    return students;
}

function calculatePositions(students) {
    const sorted = [...students].sort((a, b) => {
        const averageA = Number(a.average_marks) || 0;
        const averageB = Number(b.average_marks) || 0;
        return averageB - averageA || Number(a.student_id) - Number(b.student_id);
    });

    let previousAverage = null;
    let previousPosition = 0;

    sorted.forEach((student, index) => {
        const average = Number(student.average_marks) || 0;
        const sameResult = average === previousAverage;

        if (sameResult) {
            student.position = previousPosition;
        } else {
            student.position = index + 1;
            previousPosition = student.position;
        }

        previousAverage = average;
    });

    return sorted;
}

async function generateReport(filters = {}) {
    filters = normalizeReportFilters(filters);
    const examination = await getExamination(filters.examination_id);
    if (!examination) {
        throw new Error("Examination haijapatikana.");
    }
    if (!['OPEN', 'CLOSED'].includes(examination.status)) {
        throw new Error("Ripoti haiwezi kutengenezwa kwa examination ambayo haijafunguliwa.");
    }
    if (Number(examination.academic_year_id) !== filters.academic_year_id) {
        throw new Error("Examination haifanani na Academic Year uliyochagua.");
    }

    const classInfo = await getClassInformation(filters.class_id);
    if (!classInfo || classInfo.status !== "ACTIVE") throw new Error("Darasa halijapatikana.");
    if (Number(classInfo.academic_year_id) !== filters.academic_year_id) {
        throw new Error("Darasa halifanani na Academic Year uliyochagua.");
    }
    if (Number(classInfo.form_id) !== filters.form_id) {
        throw new Error("Darasa halifanani na Form uliyochagua.");
    }

    let studentInfo = null;
    if (filters.student_id) {
        studentInfo = await getStudentInformation(filters.student_id);
        if (!studentInfo || studentInfo.status !== "ACTIVE") {
            throw new Error("Mwanafunzi haijapatikana.");
        }
        if (Number(studentInfo.class_id) !== Number(classInfo.id)) {
            throw new Error("Mwanafunzi hayupo kwenye darasa ulilochagua.");
        }
    }

    if (filters.report_type === "subject") {
                const subjectCondition = filters.subject_id ? "AND ta.subject_id = ?" : "";
                const assignmentParams = [classInfo.id, classInfo.academic_year_id];
                if (filters.subject_id) assignmentParams.push(filters.subject_id);
        const [assignments] = await db.query(`
            SELECT ta.id
            FROM teacher_assignments ta
            INNER JOIN subjects s ON s.id = ta.subject_id
            WHERE ta.class_id = ? AND ta.academic_year_id = ?
                            ${subjectCondition} AND ta.status = 'ACTIVE' AND s.status = 'ACTIVE'
            LIMIT 1
                `, assignmentParams);
                if (!assignments.length) throw new Error("Hakuna masomo yaliyopangiwa darasa ulilochagua.");
    }

    const marks = await getApprovedMarks(filters, classInfo);
    if (!marks.length) throw new Error("No approved results are available for the selected criteria.");

    if (["class", "student"].includes(filters.report_type) && !filters.preview_only) {
        await validateClassReportReadiness(
            classInfo,
            filters.examination_id,
            filters.report_type === "student" ? filters.student_id : null
        );
    }

    const school = await getSchoolInformation();
    const classTeacher = await getClassTeacher(classInfo.id, classInfo.academic_year_id);
    const students = calculatePositions(buildStudentResults(marks));

    if (filters.report_type !== "student" && filters.report_type !== "subject") {
        for (const student of students) {
            student.class_size = students.length;
            student.class_position = student.position;
        }
    }

    if (filters.report_type === "student") {
        const classMarks = await getApprovedMarks({
            ...filters,
            class_id: classInfo.id,
            student_id: null,
            subject_id: null,
            report_type: "class"
        }, classInfo);
        const classStudents = calculatePositions(buildStudentResults(classMarks));
        const classRank = classStudents.find((student) => Number(student.student_id) === Number(filters.student_id));
        if (!classRank) {
            throw new Error("Hakuna matokeo yaliyoidhinishwa ya mwanafunzi huyu kwenye darasa na mtihani uliochaguliwa.");
        }
        if (classRank && students[0]) {
            const [[roster]] = await db.query(
                "SELECT COUNT(*) AS student_count FROM students WHERE class_id = ? AND status = 'ACTIVE'",
                [classInfo.id]
            );
            const classIsComplete = Number(roster.student_count) === classStudents.length;
            students[0].position = classIsComplete ? classRank.position : null;
            students[0].class_position = students[0].position;
            students[0].class_size = Number(roster.student_count);
        }
    }
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
        const subjectMarks = marks
            .filter((mark) => Number(mark.subject_id) === subject.subject_id)
            .map((mark) => Number(mark.mark));
        const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        marks.filter((mark) => Number(mark.subject_id) === subject.subject_id).forEach((mark) => {
            const grade = mark.grade || calculateGrade(mark.mark);
            if (gradeDistribution[grade] !== undefined) gradeDistribution[grade] += 1;
        });
        subject.average_marks = subject.students > 0
            ? Number((subject.total_marks / subject.students).toFixed(2))
            : 0;
        subject.highest_mark = subjectMarks.length ? Math.max(...subjectMarks) : null;
        subject.lowest_mark = subjectMarks.length ? Math.min(...subjectMarks) : null;
        subject.grade_distribution = gradeDistribution;
        subject.total_marks = Number(subject.total_marks.toFixed(2));
    }

    const [[roster]] = await db.query(
        "SELECT COUNT(*) AS total_students FROM students WHERE class_id = ? AND status = 'ACTIVE'",
        [classInfo.id]
    );
    const totalMarks = students.reduce((total, student) => total + Number(student.total_marks), 0);
    const totalPoints = students.reduce((total, student) => total + Number(student.total_points), 0);
    const overallAverage = students.length > 0
        ? Number((students.reduce((total, student) => total + Number(student.average_marks), 0) / students.length).toFixed(2))
        : 0;
    const divisionCounts = { I: 0, II: 0, III: 0, IV: 0, "0": 0 };
    students.forEach((student) => {
        if (Object.hasOwn(divisionCounts, student.division)) divisionCounts[student.division] += 1;
    });

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
        academic_year: { id: classInfo.academic_year_id, year_label: classInfo.year_label },
        form: { id: classInfo.form_id, form_name: classInfo.form_name },
        academic_master: { name: school.academic_master },
        head_of_school: { name: school.head_of_school },
        class: {
            id: classInfo.id,
            name: classInfo.class_name,
            form_id: classInfo.form_id,
            form_name: classInfo.form_name,
            academic_year_id: classInfo.academic_year_id,
            year_label: classInfo.year_label
        },
        class_teacher: classTeacher,
        students,
        subject_summary: subjectSummary,
        subject_performance: filters.report_type === "subject" ? subjectSummary : null,
        summary: {
            students: Number(roster.total_students),
            total_students: Number(roster.total_students),
            approved_students: new Set(marks.map((mark) => Number(mark.student_id))).size,
            average: overallAverage,
            total_points: totalPoints,
            total_marks: Number(totalMarks.toFixed(2)),
            approved: new Set(marks.map((mark) => Number(mark.student_id))).size,
            division_counts: divisionCounts
        },
        report_type: filters.report_type
    };
}

module.exports = {
    getReportOptions,
    getStudentsForClass,
    getSchoolInformation,
    getExamination,
    getClassInformation,
    getClassTeacher,
    getApprovedMarks,
    resolveClassSubjectCatalog,
    getClassRequiredSubjects,
    calculateGrade,
    calculateOverallRemark,
    calculatePoints,
    calculateDivision,
    divisionOrder,
    buildStudentResults,
    calculatePositions,
    normalizeReportFilters,
    generateReport
};
