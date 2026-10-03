const pool = require("../config/database");
const notificationModel = require("./notificationModel");

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
    const [teachers] = await pool.execute("SELECT id, teacher_number, CONCAT_WS(' ', first_name, middle_name, last_name) AS teacher_name FROM teachers WHERE status = 'ACTIVE' ORDER BY first_name, last_name");
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
               m.mark, m.status AS mark_status
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

async function getResults() {
    const [rows] = await pool.execute(`
        SELECT r.id, r.total_marks, r.average AS average_marks, r.total_points, r.division, r.position, 'PROCESSED' AS status,
               st.admission_number, CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
               c.class_name, e.exam_name, e.term, ay.year_label AS academic_year
        FROM result_summaries r
        INNER JOIN students st ON st.id = r.student_id
        INNER JOIN classes c ON c.id = st.class_id
        INNER JOIN examinations e ON e.id = r.examination_id
        INNER JOIN academic_years ay ON ay.id = e.academic_year_id
        ORDER BY ay.id DESC, e.id DESC, c.class_name, r.position
    `);
    return rows;
}

async function getReports() {
    const [rows] = await pool.execute(`
        SELECT e.id AS examination_id, e.exam_name, e.term, ay.year_label AS academic_year,
               c.class_name, COUNT(r.id) AS students,
               ROUND(AVG(r.average), 2) AS class_average,
               SUM(CASE WHEN r.division = 'I' THEN 1 ELSE 0 END) AS division_i,
               SUM(CASE WHEN r.division = 'II' THEN 1 ELSE 0 END) AS division_ii,
               SUM(CASE WHEN r.division = 'III' THEN 1 ELSE 0 END) AS division_iii,
               SUM(CASE WHEN r.division = 'IV' THEN 1 ELSE 0 END) AS division_iv,
               SUM(CASE WHEN r.division = '0' THEN 1 ELSE 0 END) AS division_zero
        FROM result_summaries r
        INNER JOIN examinations e ON e.id = r.examination_id
        INNER JOIN academic_years ay ON ay.id = e.academic_year_id
        INNER JOIN students st ON st.id = r.student_id
        INNER JOIN classes c ON c.id = st.class_id
        GROUP BY e.id, e.exam_name, e.term, ay.year_label, c.id, c.class_name
        ORDER BY ay.id DESC, e.id DESC, c.class_name
    `);
    return rows;
}

async function getReportOptions() {
    const [examinations] = await pool.execute(`
        SELECT e.id, e.exam_name, e.exam_type, e.term, e.academic_year_id,
               ay.year_label AS academic_year
        FROM examinations e
        INNER JOIN academic_years ay ON ay.id = e.academic_year_id
        WHERE EXISTS (
            SELECT 1
            FROM result_summaries rs
            INNER JOIN students st ON st.id = rs.student_id
            WHERE rs.examination_id = e.id
              AND EXISTS (
                  SELECT 1 FROM marks m
                  WHERE m.student_id = st.id AND m.examination_id = e.id AND m.status = 'APPROVED'
              )
              AND NOT EXISTS (
                  SELECT 1 FROM marks pending
                  WHERE pending.student_id = st.id AND pending.examination_id = e.id
                    AND pending.status <> 'APPROVED'
              )
        )
        ORDER BY ay.id DESC, e.id DESC
    `);
    const [classes] = await pool.execute(`
        SELECT c.id, c.class_name, c.academic_year_id, ay.year_label AS academic_year
        FROM classes c
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.status = 'ACTIVE' AND EXISTS (
            SELECT 1
            FROM result_summaries rs
            INNER JOIN students st ON st.id = rs.student_id
            WHERE st.class_id = c.id
              AND EXISTS (
                  SELECT 1 FROM marks m
                  WHERE m.student_id = st.id AND m.examination_id = rs.examination_id AND m.status = 'APPROVED'
              )
              AND NOT EXISTS (
                  SELECT 1 FROM marks pending
                  WHERE pending.student_id = st.id AND pending.examination_id = rs.examination_id
                    AND pending.status <> 'APPROVED'
              )
        )
        ORDER BY ay.id DESC, c.class_name ASC
    `);
    return { examinations, classes };
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

    const [students] = await pool.execute(`
        SELECT st.id, st.admission_number,
               CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
               st.gender, st.class_id,
               rs.total_marks, rs.average, rs.total_points,
               CASE
                   WHEN rs.total_points BETWEEN 7 AND 17 THEN 'DIVISION I'
                   WHEN rs.total_points BETWEEN 18 AND 21 THEN 'DIVISION II'
                   WHEN rs.total_points BETWEEN 22 AND 25 THEN 'DIVISION III'
                   WHEN rs.total_points BETWEEN 26 AND 32 THEN 'DIVISION IV'
                   ELSE 'DIVISION 0'
               END AS division,
               ROW_NUMBER() OVER (
                   ORDER BY
                       CASE
                           WHEN rs.total_points BETWEEN 7 AND 17 THEN 1
                           WHEN rs.total_points BETWEEN 18 AND 21 THEN 2
                           WHEN rs.total_points BETWEEN 22 AND 25 THEN 3
                           WHEN rs.total_points BETWEEN 26 AND 32 THEN 4
                           ELSE 5
                       END,
                       rs.total_points ASC,
                       st.last_name ASC,
                       st.first_name ASC
               ) AS class_position
        FROM students st
        INNER JOIN result_summaries rs
            ON rs.student_id = st.id AND rs.examination_id = ?
        WHERE st.class_id = ? AND st.status = 'ACTIVE'
          AND EXISTS (
              SELECT 1 FROM marks approved
              WHERE approved.student_id = st.id AND approved.examination_id = ? AND approved.status = 'APPROVED'
          )
          AND NOT EXISTS (
              SELECT 1 FROM marks pending
              WHERE pending.student_id = st.id AND pending.examination_id = ? AND pending.status <> 'APPROVED'
          )
        ORDER BY class_position
    `, [examinationId, classId, examinationId, examinationId]);

    if (!students.length) throw new Error("Hakuna matokeo yaliyoidhinishwa kwa darasa na mtihani uliochaguliwa.");

    const [subjectRows] = await pool.execute(`
        SELECT m.student_id, s.id AS subject_id, s.subject_name,
               m.mark,
               COALESCE(m.grade, CASE
                   WHEN m.mark >= 75 THEN 'A'
                   WHEN m.mark >= 65 THEN 'B'
                   WHEN m.mark >= 45 THEN 'C'
                   WHEN m.mark >= 30 THEN 'D'
                   ELSE 'F'
               END) AS grade,
               COALESCE(m.points, CASE
                   WHEN m.mark >= 75 THEN 1
                   WHEN m.mark >= 65 THEN 2
                   WHEN m.mark >= 45 THEN 3
                   WHEN m.mark >= 30 THEN 4
                   ELSE 5
               END) AS points
        FROM marks m
        INNER JOIN students st ON st.id = m.student_id
        INNER JOIN subjects s ON s.id = m.subject_id
        WHERE m.examination_id = ? AND st.class_id = ?
          AND st.status = 'ACTIVE' AND m.status = 'APPROVED'
        ORDER BY m.student_id ASC, s.id ASC
    `, [examinationId, classId]);

    const subjectsByStudent = new Map();
    for (const subject of subjectRows) {
        const subjectList = subjectsByStudent.get(Number(subject.student_id)) || [];
        subjectList.push({
            subject_id: Number(subject.subject_id),
            subject_name: subject.subject_name,
            marks: Number(subject.mark),
            grade: subject.grade,
            points: Number(subject.points)
        });
        subjectsByStudent.set(Number(subject.student_id), subjectList);
    }

    for (const student of students) {
        student.class_position = Number(student.class_position);
        student.total_marks = Number(student.total_marks);
        student.average = Number(student.average);
        student.total_points = Number(student.total_points);
        student.subjects = subjectsByStudent.get(Number(student.id)) || [];
    }

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
            SELECT school_name, po_box, phone, email
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
