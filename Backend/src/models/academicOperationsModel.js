const pool = require("../config/database");
const notificationModel = require("./notificationModel");
const reportService = require("../services/reportServices");

async function getExaminations() {
    const [rows] = await pool.execute(`
        SELECT e.id, e.exam_name, e.exam_type, e.term, e.start_date, e.end_date, e.status,
               e.academic_year_id, ay.year_label AS academic_year
        FROM examinations e
        INNER JOIN academic_years ay ON ay.id = e.academic_year_id
        ORDER BY ay.id DESC, e.id DESC
    `);
    return rows;
}

async function getExaminationOptions() {
    const [years] = await pool.execute("SELECT id, year_label FROM academic_years ORDER BY id DESC");
    return { years };
}

async function createExamination(data) {
    const [result] = await pool.execute(`
        INSERT INTO examinations (academic_year_id, exam_name, exam_type, term, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [data.academic_year_id, data.exam_name, data.exam_type, data.term || null, data.start_date || null, data.end_date || null, data.status]);
    return result.insertId;
}

async function updateExaminationStatus(id, status) {
    const [result] = await pool.execute("UPDATE examinations SET status = ? WHERE id = ?", [status, id]);
    return result.affectedRows;
}

async function getAssignments() {
    const [rows] = await pool.execute(`
        SELECT ta.id, ta.status, t.teacher_number,
               CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name,
               c.class_name, s.subject_code, s.subject_name, ay.year_label AS academic_year
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.id = ta.teacher_id
        INNER JOIN classes c ON c.id = ta.class_id
        INNER JOIN subjects s ON s.id = ta.subject_id
        INNER JOIN academic_years ay ON ay.id = ta.academic_year_id
        ORDER BY ay.id DESC, c.class_name, s.id ASC
    `);
    return rows;
}

async function getClassTeachers() {
    const [rows] = await pool.execute(`
        SELECT cta.id, cta.status, c.class_name, ay.year_label AS academic_year,
               t.teacher_number, CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name
        FROM class_teachers cta
        INNER JOIN classes c ON c.id = cta.class_id
        INNER JOIN academic_years ay ON ay.id = cta.academic_year_id
        INNER JOIN teachers t ON t.id = cta.teacher_id
        ORDER BY ay.id DESC, c.class_name
    `);
    return rows;
}

async function getClassTeacherOptions() {
    const [teachers] = await pool.execute("SELECT id, teacher_number, CONCAT_WS(' ', first_name, middle_name, last_name) AS teacher_name FROM teachers WHERE status = 'ACTIVE' ORDER BY id ASC");
    const [classes] = await pool.execute(`
        SELECT c.id, c.class_name, c.academic_year_id, f.form_name, ay.year_label AS academic_year
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.status = 'ACTIVE'
        ORDER BY ay.id DESC, f.form_name ASC, c.class_name ASC
    `);
    const [years] = await pool.execute("SELECT id, year_label FROM academic_years WHERE status IN ('ACTIVE','INACTIVE') ORDER BY id DESC");
    return { teachers, classes, years };
}

async function createClassTeacher(data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [validAssignment] = await connection.execute(`
            SELECT c.id
            FROM classes c
            INNER JOIN teachers t ON t.id = ? AND t.status = 'ACTIVE'
            WHERE c.id = ? AND c.academic_year_id = ? AND c.status = 'ACTIVE'
            LIMIT 1
        `, [data.teacher_id, data.class_id, data.academic_year_id]);
        if (!validAssignment.length) throw new Error("Mwalimu, darasa na mwaka wa masomo havilingani au havipo active.");
        const [existing] = await connection.execute(`
            SELECT id FROM class_teachers
            WHERE class_id = ? AND academic_year_id = ?
            ORDER BY id DESC LIMIT 1 FOR UPDATE
        `, [data.class_id, data.academic_year_id]);
        if (existing[0]) {
            await connection.execute(`
                UPDATE class_teachers SET teacher_id = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [data.teacher_id, existing[0].id]);
            await connection.commit();
            return Number(existing[0].id);
        }
        const [result] = await connection.execute(`
            INSERT INTO class_teachers (teacher_id, class_id, academic_year_id, status)
            VALUES (?, ?, ?, 'ACTIVE')
        `, [data.teacher_id, data.class_id, data.academic_year_id]);
        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function getSubmissions() {
    const [submissions] = await pool.execute(`
        SELECT ms.id, ms.teacher_assignment_id, ms.examination_id,
               ms.status, ms.submitted_at, ms.reviewed_at, ms.review_comment,
               e.exam_name, e.term, ay.year_label AS academic_year,
               c.id AS class_id, c.academic_year_id, c.form_id, c.class_name, f.form_name,
               s.id AS subject_id, s.subject_name,
               t.teacher_number,
               CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name
        FROM mark_submissions ms
        INNER JOIN teacher_assignments ta ON ta.id = ms.teacher_assignment_id
        INNER JOIN teachers t ON t.id = ta.teacher_id
        INNER JOIN classes c ON c.id = ta.class_id
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN subjects s ON s.id = ta.subject_id
        INNER JOIN academic_years ay ON ay.id = ta.academic_year_id
        INNER JOIN examinations e ON e.id = ms.examination_id
        WHERE ms.id = (
            SELECT MAX(latest_submission.id)
            FROM mark_submissions latest_submission
            WHERE latest_submission.teacher_assignment_id = ms.teacher_assignment_id
              AND latest_submission.examination_id = ms.examination_id
        )
        ORDER BY ay.id DESC, f.form_name, c.class_name, e.id DESC, s.subject_name
    `);

    const [marks] = await pool.execute(`
        SELECT m.teacher_assignment_id, m.examination_id, m.student_id,
               st.admission_number,
               CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
               m.marks AS mark, m.status AS mark_status
        FROM marks m
        INNER JOIN students st ON st.id = m.student_id
        WHERE m.id = (
            SELECT MAX(latest_mark.id)
            FROM marks latest_mark
            WHERE latest_mark.teacher_assignment_id = m.teacher_assignment_id
              AND latest_mark.examination_id = m.examination_id
              AND latest_mark.student_id = m.student_id
        )
    `);

    const [assignedSubjects] = await pool.execute(`
        SELECT DISTINCT ta.class_id, ta.academic_year_id,
               subject.id AS subject_id, subject.subject_name
        FROM teacher_assignments ta
        INNER JOIN subjects subject ON subject.id = ta.subject_id
        WHERE ta.status = 'ACTIVE'
        ORDER BY subject.subject_name
    `);

    const [classStudents] = await pool.execute(`
         SELECT st.id AS student_id, st.admission_number,
             CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
             st.class_id, c.academic_year_id
         FROM students st
         INNER JOIN classes c ON c.id = st.class_id
         WHERE st.status = 'ACTIVE'
         ORDER BY st.id ASC
    `);

    const subjectsByClass = new Map();
    for (const subject of assignedSubjects) {
        const key = `${subject.class_id}:${subject.academic_year_id}`;
        if (!subjectsByClass.has(key)) subjectsByClass.set(key, []);
        subjectsByClass.get(key).push({ id: subject.subject_id, name: subject.subject_name });
    }

    const studentsByClass = new Map();
    for (const student of classStudents) {
        const key = `${student.class_id}:${student.academic_year_id}`;
        if (!studentsByClass.has(key)) studentsByClass.set(key, []);
        studentsByClass.get(key).push(student);
    }

    const marksBySubmission = new Map();
    for (const mark of marks) {
        const key = `${mark.teacher_assignment_id}:${mark.examination_id}`;
        if (!marksBySubmission.has(key)) marksBySubmission.set(key, []);
        marksBySubmission.get(key).push(mark);
    }

    return submissions.map((submission) => {
        const key = `${submission.teacher_assignment_id}:${submission.examination_id}`;
        const students = marksBySubmission.get(key) || [];
        const classKey = `${submission.class_id}:${submission.academic_year_id}`;
        return {
            ...submission,
            students,
            assigned_subjects: subjectsByClass.get(classKey) || [],
            class_students: studentsByClass.get(classKey) || [],
            marks_count: students.length
        };
    });
}

async function reviewSubmission(id, reviewerId, status, comment) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(`
            SELECT ms.teacher_assignment_id, ms.examination_id, ms.status,
                   t.user_id AS teacher_user_id, c.class_name, s.subject_name, e.exam_name
            FROM mark_submissions ms
            INNER JOIN teacher_assignments ta ON ta.id = ms.teacher_assignment_id
            INNER JOIN teachers t ON t.id = ta.teacher_id
            INNER JOIN classes c ON c.id = ta.class_id
            INNER JOIN subjects s ON s.id = ta.subject_id
            INNER JOIN examinations e ON e.id = ms.examination_id
            WHERE ms.id = ?
            FOR UPDATE
        `, [id]);
        const submission = rows[0];
        if (!submission) throw new Error("Submission haijapatikana.");
        if (submission.status !== "SUBMITTED") throw new Error("Ni submissions zilizotumwa tu zinaweza kukaguliwa.");
        await connection.execute(`
            UPDATE mark_submissions
            SET status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = NOW()
            WHERE id = ?
        `, [status, comment || null, reviewerId, id]);
        await connection.execute(`
            UPDATE marks SET status = ?
            WHERE teacher_assignment_id = ? AND examination_id = ? AND status = 'SUBMITTED'
        `, [status, submission.teacher_assignment_id, submission.examination_id]);
        if (status === "RETURNED") {
            await notificationModel.createForUser(submission.teacher_user_id, {
                senderUserId: reviewerId,
                title: "Alama zimerudishwa kwa marekebisho",
                message: `Alama za ${submission.subject_name} - ${submission.class_name} (${submission.exam_name}) zimerudishwa. Sababu: ${comment}`,
                type: "MARKS_RETURNED",
                referenceType: "MARK_SUBMISSION",
                referenceId: Number(id)
            }, connection);
        }
        await connection.commit();
        return { id: Number(id), status };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function getApprovedResultMarkRows(examinationId = null, classId = null) {
    const conditions = ["m.status = 'APPROVED'", "ta.status = 'ACTIVE'", "e.status IN ('OPEN', 'CLOSED')"];
    const params = [];
    if (examinationId) {
        conditions.push("e.id = ?");
        params.push(examinationId);
    }
    if (classId) {
        conditions.push("c.id = ?");
        params.push(classId);
    }

    const [rows] = await pool.execute(`
        SELECT m.student_id, m.subject_id, m.examination_id, m.teacher_assignment_id,
               m.marks AS mark, m.grade, m.points,
               st.admission_number, st.first_name, st.middle_name, st.last_name, st.gender,
               c.id AS class_id, c.class_name, c.form_id, c.academic_year_id,
               f.form_name, ay.year_label, e.exam_name, e.exam_type, e.term,
               subject.subject_code, subject.subject_name
        FROM marks m
        INNER JOIN teacher_assignments ta ON ta.id = m.teacher_assignment_id
        INNER JOIN students st ON st.id = m.student_id
        INNER JOIN examinations e ON e.id = m.examination_id
        INNER JOIN classes c ON c.id = ta.class_id AND c.academic_year_id = e.academic_year_id
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = e.academic_year_id
        INNER JOIN subjects subject ON subject.id = m.subject_id
        INNER JOIN student_class_enrollments enrollment
            ON enrollment.student_id = st.id
           AND enrollment.class_id = c.id
           AND enrollment.academic_year_id = e.academic_year_id
        INNER JOIN student_subjects eligible
            ON eligible.student_id = st.id
           AND eligible.class_id = c.id
           AND eligible.subject_id = m.subject_id
        WHERE ${conditions.join(" AND ")}
          AND m.id = (
              SELECT MAX(latest_mark.id)
              FROM marks latest_mark
              WHERE latest_mark.teacher_assignment_id = m.teacher_assignment_id
                AND latest_mark.student_id = m.student_id
                AND latest_mark.examination_id = m.examination_id
          )
          AND NOT EXISTS (
              SELECT 1
              FROM marks pending
              INNER JOIN teacher_assignments pending_assignment
                  ON pending_assignment.id = pending.teacher_assignment_id
              WHERE pending.student_id = m.student_id
                AND pending.examination_id = m.examination_id
                AND pending_assignment.class_id = c.id
                AND pending.status <> 'APPROVED'
          )
          AND (
              SELECT COUNT(DISTINCT expected.subject_id)
              FROM teacher_assignments expected
              INNER JOIN student_subjects expected_enrollment
                  ON expected_enrollment.student_id = st.id
                 AND expected_enrollment.class_id = c.id
                 AND expected_enrollment.subject_id = expected.subject_id
              WHERE expected.class_id = c.id
                AND expected.academic_year_id = e.academic_year_id
                AND expected.status = 'ACTIVE'
          ) = (
              SELECT COUNT(DISTINCT approved_assignment.subject_id)
              FROM marks approved
              INNER JOIN teacher_assignments approved_assignment
                  ON approved_assignment.id = approved.teacher_assignment_id
              WHERE approved.student_id = st.id
                AND approved.examination_id = e.id
                AND approved_assignment.class_id = c.id
                AND approved_assignment.academic_year_id = e.academic_year_id
                AND approved_assignment.status = 'ACTIVE'
                AND approved.status = 'APPROVED'
          )
        ORDER BY ay.id DESC, e.id DESC, c.class_name,
                 st.first_name, st.middle_name, st.last_name, subject.subject_name
    `, params);
    return rows;
}

function buildApprovedResultRows(markRows) {
    const groups = new Map();
    for (const mark of markRows) {
        const key = `${mark.examination_id}:${mark.class_id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(mark);
    }

    const results = [];
    for (const marks of groups.values()) {
        const rankedStudents = reportService.calculatePositions(
            reportService.buildStudentResults(marks)
        );
        const firstMark = marks[0];
        for (const student of rankedStudents) {
            results.push({
                ...student,
                status: "PROCESSED",
                exam_name: firstMark.exam_name,
                exam_type: firstMark.exam_type,
                term: firstMark.term,
                examination_id: Number(firstMark.examination_id),
                academic_year_id: Number(firstMark.academic_year_id),
                academic_year: firstMark.year_label,
                class_id: Number(firstMark.class_id),
                class_name: firstMark.class_name,
                form_id: Number(firstMark.form_id),
                form_name: firstMark.form_name,
                student_name: student.full_name,
                average_marks: student.average_marks
            });
        }
    }
    return results;
}

async function getResults() {
    const results = buildApprovedResultRows(await getApprovedResultMarkRows());
    return results.sort((left, right) =>
        right.academic_year_id - left.academic_year_id ||
        right.examination_id - left.examination_id ||
        left.class_name.localeCompare(right.class_name) ||
        left.position - right.position
    );
}

async function getReports() {
    const results = buildApprovedResultRows(await getApprovedResultMarkRows());
    const groups = new Map();
    for (const result of results) {
        const key = `${result.examination_id}:${result.class_id}`;
        if (!groups.has(key)) {
            groups.set(key, {
                examination_id: result.examination_id,
                exam_name: result.exam_name,
                term: result.term,
                academic_year: result.academic_year,
                class_name: result.class_name,
                students: 0,
                average_total: 0,
                division_i: 0,
                division_ii: 0,
                division_iii: 0,
                division_iv: 0,
                division_zero: 0
            });
        }
        const group = groups.get(key);
        group.students += 1;
        group.average_total += Number(result.average_marks);
        const divisionKey = ({
            I: "division_i",
            II: "division_ii",
            III: "division_iii",
            IV: "division_iv",
            "0": "division_zero"
        })[result.division];
        if (divisionKey) group[divisionKey] += 1;
    }
    return [...groups.values()]
        .map(({ average_total, ...group }) => ({
            ...group,
            class_average: Number((average_total / group.students).toFixed(2))
        }))
        .sort((left, right) =>
            right.academic_year.localeCompare(left.academic_year) ||
            right.examination_id - left.examination_id ||
            left.class_name.localeCompare(right.class_name)
        );
}

async function getReportOptions() {
    const results = buildApprovedResultRows(await getApprovedResultMarkRows());
    const examinations = new Map();
    const classes = new Map();
    for (const result of results) {
        if (!examinations.has(result.examination_id)) {
            examinations.set(result.examination_id, {
                id: result.examination_id,
                exam_name: result.exam_name,
                exam_type: result.exam_type,
                term: result.term,
                academic_year_id: result.academic_year_id,
                academic_year: result.academic_year
            });
        }
        if (!classes.has(result.class_id)) {
            classes.set(result.class_id, {
                id: result.class_id,
                class_name: result.class_name,
                academic_year_id: result.academic_year_id,
                academic_year: result.academic_year
            });
        }
    }
    return {
        examinations: [...examinations.values()],
        classes: [...classes.values()]
    };
}

async function getReportDetails(examinationId, classId) {
    const [[examinationRows], [classRows], [schoolRows]] = await Promise.all([
        pool.execute(`
            SELECT e.id, e.exam_name, e.exam_type, e.term, e.academic_year_id,
                   ay.year_label AS academic_year
            FROM examinations e
            INNER JOIN academic_years ay ON ay.id = e.academic_year_id
            WHERE e.id = ? LIMIT 1
        `, [examinationId]),
        pool.execute(`
            SELECT c.id, c.class_name, c.academic_year_id, ay.year_label AS academic_year
            FROM classes c
            INNER JOIN academic_years ay ON ay.id = c.academic_year_id
            WHERE c.id = ? LIMIT 1
        `, [classId]),
        pool.execute(`
            SELECT ss.school_name, ss.po_box, ss.motto, ss.head_of_school,
                   COALESCE(u.username, '') AS academic_master_name
            FROM school_settings ss
            LEFT JOIN users u ON u.id = ss.academic_master_user_id
            WHERE ss.status = 'ACTIVE'
            ORDER BY ss.id DESC LIMIT 1
        `)
    ]);

    const examination = examinationRows[0];
    const selectedClass = classRows[0];
    const school = schoolRows[0] || {};
    if (!examination) throw new Error("Mtihani haujapatikana.");
    if (!selectedClass) throw new Error("Darasa halijapatikana.");
    if (Number(examination.academic_year_id) !== Number(selectedClass.academic_year_id)) {
        throw new Error("Darasa na mtihani lazima viwe vya mwaka mmoja wa masomo.");
    }

    const [classTeacherRows] = await pool.execute(`
        SELECT CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS class_teacher_name,
               t.teacher_number
        FROM class_teachers ct
        INNER JOIN teachers t ON t.id = ct.teacher_id
        WHERE ct.class_id = ? AND ct.academic_year_id = ? AND ct.status = 'ACTIVE'
        ORDER BY ct.id DESC LIMIT 1
    `, [classId, selectedClass.academic_year_id]);

    const marks = await getApprovedResultMarkRows(examinationId, classId);
    const rankedStudents = buildApprovedResultRows(marks);
    const students = rankedStudents.map((student) => ({
        id: student.student_id,
        student_id: student.student_id,
        admission_number: student.admission_number,
        student_name: student.full_name,
        gender: student.gender,
        class_id: student.class_id,
        total_marks: student.total_marks,
        average: student.average_marks,
        total_points: student.total_points,
        division: student.division === "N/A" ? "N/A" : `DIVISION ${student.division}`,
        class_position: student.position,
        subjects: student.subjects.map((subject) => ({
            subject_id: subject.subject_id,
            subject_name: subject.subject_name,
            marks: subject.marks,
            grade: subject.grade,
            points: subject.points
        }))
    }));
    if (!students.length) throw new Error("Hakuna matokeo yaliyoidhinishwa na kukamilika kwa darasa na mtihani uliochaguliwa.");

    return {
        school,
        examination,
        class: selectedClass,
        signatories: {
            head_of_school: school.head_of_school || "",
            academic_master: school.academic_master_name || "",
            class_teacher: classTeacherRows[0]?.class_teacher_name || "",
            class_teacher_number: classTeacherRows[0]?.teacher_number || ""
        },
        students
    };
}

async function getAcademicMasterProfile(userId) {
    const [[users], [schools]] = await Promise.all([
        pool.execute(`
            SELECT id, username, role, status, created_at, updated_at
            FROM users WHERE id = ? AND role = 'ACADEMIC_MASTER' LIMIT 1
        `, [userId]),
        pool.execute(`
            SELECT school_name, po_box, head_of_school, phone, email
            FROM school_settings WHERE status = 'ACTIVE'
            ORDER BY id DESC LIMIT 1
        `)
    ]);
    if (!users[0]) throw new Error("Wasifu haujapatikana.");
    return { user: users[0], school: schools[0] || null };
}

async function getOwnPasswordHash(userId) {
    const [rows] = await pool.execute(
        "SELECT password_hash FROM users WHERE id = ? AND role = 'ACADEMIC_MASTER' LIMIT 1",
        [userId]
    );
    return rows[0] || null;
}

module.exports = { getExaminations, getExaminationOptions, createExamination, updateExaminationStatus, getAssignments, getClassTeachers, getClassTeacherOptions, createClassTeacher, getSubmissions, reviewSubmission, getResults, getReports, getReportOptions, getReportDetails, getAcademicMasterProfile, getOwnPasswordHash };
