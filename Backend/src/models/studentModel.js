const pool = require("../config/database");
const {
    createTemporaryIdentifier,
    createStudentAdmissionNumber
} = require("../utils/generatedIdentifiers");

function normalizeClassName(value) {
    return String(value || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/^FORM_?/, "");
}

async function ensureClassHasCapacity(connection, classId, studentStatus, excludeStudentId = null) {
    const [classes] = await connection.execute(
        "SELECT capacity, status FROM classes WHERE id = ? FOR UPDATE",
        [classId]
    );
    const classRecord = classes[0];

    if (!classRecord) {
        throw new Error("Darasa lililochaguliwa halipatikani au halitumiki.");
    }

    if (String(studentStatus || "ACTIVE").toUpperCase() !== "ACTIVE") {
        return;
    }
    if (classRecord.status !== "ACTIVE") {
        throw new Error("Darasa lililochaguliwa halipatikani au halitumiki.");
    }
    if (classRecord.capacity === null) return;

    let sql = "SELECT COUNT(*) AS active_students FROM students WHERE class_id = ? AND status = 'ACTIVE'";
    const params = [classId];
    if (excludeStudentId !== null) {
        sql += " AND id <> ?";
        params.push(excludeStudentId);
    }

    const [counts] = await connection.execute(sql, params);
    if (Number(counts[0]?.active_students || 0) >= Number(classRecord.capacity)) {
        throw new Error(`Darasa limefikia uwezo wake wa wanafunzi ${classRecord.capacity}. Chagua darasa lingine.`);
    }
}

async function getStudents() {
    const sql = `
        SELECT
            s.id,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.gender,
            s.date_of_birth,
            s.admission_date,
            s.status,
            s.academic_stream,
            s.islamic_studies,
            c.id AS class_id,
            c.class_name,
            CAST(REPLACE(REPLACE(UPPER(f.form_name), 'FORM', ''), ' ', '') AS UNSIGNED) AS form_number,
            f.form_name,
            ay.year_label AS academic_year
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN forms f ON f.id = c.form_id
        LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
        ORDER BY s.id ASC
    `;

    const [rows] = await pool.execute(sql);

    return rows.map((row) => ({
        id: Number(row.id),
        admission_number: row.admission_number,
        first_name: row.first_name,
        middle_name: row.middle_name,
        last_name: row.last_name,
        gender: row.gender,
        date_of_birth: row.date_of_birth,
        admission_date: row.admission_date,
        status: row.status,
        academic_stream: row.academic_stream,
        islamic_studies: Boolean(row.islamic_studies),
        class_id: row.class_id ? Number(row.class_id) : null,
        class_name: row.class_name,
        form_number: row.form_number,
        form_name: row.form_name,
        academic_year: row.academic_year
    }));
}

async function getStudentById(id) {
    const sql = `
        SELECT
            s.id,
            s.admission_number,
            s.first_name,
            s.middle_name,
            s.last_name,
            s.gender,
            s.date_of_birth,
            s.admission_date,
            s.status,
            s.academic_stream,
            s.islamic_studies,
            c.id AS class_id,
            c.class_name,
            CAST(REPLACE(REPLACE(UPPER(f.form_name), 'FORM', ''), ' ', '') AS UNSIGNED) AS form_number,
            f.form_name,
            ay.year_label AS academic_year
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN forms f ON f.id = c.form_id
        LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE s.id = ?
        LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
}

async function getClassSubjectProfile(classId) {
    const [classes] = await pool.execute(`
        SELECT c.id, c.form_id, c.class_name,
               CAST(REPLACE(REPLACE(UPPER(f.form_name), 'FORM', ''), ' ', '') AS UNSIGNED) AS form_number,
               f.form_name
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        WHERE c.id = ? AND c.status = 'ACTIVE'
        LIMIT 1
    `, [classId]);
    if (!classes[0]) throw new Error("Darasa halijapatikana.");

    const [formSubjects] = await pool.execute(`
        SELECT s.id, s.subject_code, s.subject_name, fs.subject_order
        FROM form_subjects fs
        INNER JOIN subjects s ON s.id = fs.subject_id
        WHERE fs.form_id = ? AND fs.status = 'ACTIVE' AND s.status = 'ACTIVE'
        ORDER BY fs.subject_order ASC, s.id ASC
    `, [classes[0].form_id]);
    const [islamicSubjects] = await pool.execute(`
        SELECT id, subject_code, subject_name
        FROM subjects
        WHERE status = 'ACTIVE'
          AND (
              UPPER(TRIM(subject_code)) = 'EDK'
              OR UPPER(TRIM(subject_name)) IN (
                  'ISLAMIC KNOWLEDGE',
                  'ELIMU YA DINI YA KIISLAMU',
                  'ELIMU YA DINI YA KIISLAMU (E.D.K)'
              )
          )
    `);

    const subjects = new Map();
    for (const subject of [...formSubjects, ...islamicSubjects]) {
        subjects.set(Number(subject.id), {
            id: Number(subject.id),
            subject_code: subject.subject_code,
            subject_name: subject.subject_name
        });
    }
    return { ...classes[0], subjects: [...subjects.values()] };
}

async function getStudentSubjectIds(studentId, classId) {
    const [rows] = await pool.execute(`
        SELECT subject_id
        FROM student_subjects
        WHERE student_id = ? AND class_id = ?
        ORDER BY subject_id
    `, [studentId, classId]);
    return rows.map((row) => Number(row.subject_id));
}

async function getStudentScienceSubjects(studentId, classId) {
    const [rows] = await pool.execute(`
        SELECT UPPER(TRIM(s.subject_name)) AS subject_name
        FROM student_subjects ss
        INNER JOIN subjects s ON s.id = ss.subject_id
        WHERE ss.student_id = ? AND ss.class_id = ?
          AND UPPER(TRIM(s.subject_name)) IN ('PHYSICS', 'CHEMISTRY')
        ORDER BY s.subject_name
    `, [studentId, classId]);
    return rows.map((row) => row.subject_name);
}

async function getStudentByAdmissionNumber(admissionNumber, excludeId = null) {
    let sql = `
        SELECT *
        FROM students
        WHERE admission_number = ?
    `;

    const params = [admissionNumber];
    if (excludeId) {
        sql += " AND id <> ?";
        params.push(excludeId);
    }
    sql += " LIMIT 1";

    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
}

async function findClassByName(className, academicYear) {
    const normalizedClassName = normalizeClassName(className);

    let sql = `
        SELECT c.id, c.class_name, c.status, f.form_name, ay.year_label
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.status = 'ACTIVE'
    `;

    const params = [];

    if (academicYear) {
        sql += " AND ay.year_label = ?";
        params.push(String(academicYear).trim());
    }

    if (normalizedClassName) {
        sql += ` AND (
            c.class_name = ? OR
            REPLACE(REPLACE(UPPER(c.class_name), ' ', ''), 'FORM_', '') = ? OR
            REPLACE(REPLACE(UPPER(c.class_name), ' ', ''), 'CLASS_', '') = ?
        )`;

        params.push(
            String(className).trim(),
            normalizedClassName,
            normalizedClassName
        );
    }

    sql += " ORDER BY ay.id DESC LIMIT 1";

    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
}

async function findClassById(classId, academicYear) {
    const [rows] = await pool.execute(`
        SELECT c.id, c.class_name, c.status, f.form_name, ay.year_label
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.id = ? AND ay.year_label = ? AND c.status = 'ACTIVE'
        LIMIT 1
    `, [classId, String(academicYear || "").trim()]);
    return rows[0] || null;
}

async function createStudent(data) {
    const sql = `
        INSERT INTO students (
            admission_number,
            first_name,
            middle_name,
            last_name,
            gender,
            date_of_birth,
            class_id,
            academic_stream,
            islamic_studies,
            admission_date,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await ensureClassHasCapacity(connection, data.class_id, data.status);
            const [result] = await connection.execute(sql, [
                createTemporaryIdentifier(),
                data.first_name,
                data.middle_name || null,
                data.last_name,
                data.gender,
                data.date_of_birth || null,
                data.class_id,
                data.academic_stream,
                data.islamic_studies ? 1 : 0,
                data.admission_date || null,
                data.status || "ACTIVE"
            ]);
            const admissionNumber = createStudentAdmissionNumber(result.insertId);

            try {
                await connection.execute(
                    "UPDATE students SET admission_number = ? WHERE id = ?",
                    [admissionNumber, result.insertId]
                );
            } catch (error) {
                if (error.code !== "ER_DUP_ENTRY" || attempt === 9) throw error;
                await connection.rollback();
                continue;
            }

            const [classRows] = await connection.execute(
                "SELECT academic_year_id FROM classes WHERE id = ?",
                [data.class_id]
            );
            await connection.execute(`
                INSERT INTO student_class_enrollments
                    (student_id, class_id, academic_year_id, status)
                VALUES (?, ?, ?, ?)
            `, [
                result.insertId,
                data.class_id,
                classRows[0].academic_year_id,
                data.status === "ACTIVE" || !data.status ? "ACTIVE" : "INACTIVE"
            ]);

            for (const subjectId of data.subject_ids) {
                await connection.execute(`
                    INSERT INTO student_subjects (student_id, class_id, subject_id)
                    VALUES (?, ?, ?)
                `, [result.insertId, data.class_id, subjectId]);
            }

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback().catch(() => {});
            throw error;
        } finally {
            connection.release();
        }
    }

    throw new Error("Imeshindikana kutengeneza Admission Number ya kipekee.");
}

async function updateStudent(id, data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await ensureClassHasCapacity(connection, data.class_id, data.status, id);
        const [currentRows] = await connection.execute(
            "SELECT class_id FROM students WHERE id = ? FOR UPDATE",
            [id]
        );
        if (!currentRows.length) throw new Error("Mwanafunzi hakupatikana.");
        const currentClassId = Number(currentRows[0].class_id);
        const [targetClasses] = await connection.execute(
            "SELECT academic_year_id FROM classes WHERE id = ?",
            [data.class_id]
        );
        if (!targetClasses.length) throw new Error("Darasa lililochaguliwa halipatikani.");
        const [existingSubjects] = await connection.execute(`
            SELECT subject_id
            FROM student_subjects
            WHERE student_id = ? AND class_id = ?
            FOR UPDATE
        `, [id, data.class_id]);
        const existingSubjectIds = existingSubjects.map((row) => Number(row.subject_id)).sort((a, b) => a - b);
        const requestedSubjectIds = [...data.subject_ids].map(Number).sort((a, b) => a - b);
        const enrollmentChanged = existingSubjectIds.length !== requestedSubjectIds.length ||
            existingSubjectIds.some((subjectId, index) => subjectId !== requestedSubjectIds[index]);
        if (existingSubjects.length && enrollmentChanged) {
            const [[{ marks_count: marksCount }]] = await connection.execute(`
                SELECT COUNT(*) AS marks_count
                FROM marks m
                INNER JOIN teacher_assignments ta ON ta.id = m.teacher_assignment_id
                WHERE m.student_id = ? AND ta.class_id = ?
            `, [id, data.class_id]);
            if (Number(marksCount) > 0) {
                throw new Error("Mkondo au masomo hayawezi kubadilishwa baada ya alama kuingizwa kwa mwanafunzi huyu katika darasa hili.");
            }
        }

        const [result] = await connection.execute(`
            UPDATE students
            SET admission_number = ?, first_name = ?, middle_name = ?, last_name = ?,
                gender = ?, date_of_birth = ?, class_id = ?, academic_stream = ?,
                islamic_studies = ?, admission_date = ?, status = ?
            WHERE id = ?
        `, [data.admission_number, data.first_name, data.middle_name || null, data.last_name,
            data.gender, data.date_of_birth || null, data.class_id, data.academic_stream,
            data.islamic_studies ? 1 : 0, data.admission_date || null,
            data.status, id]);
        if (currentClassId !== Number(data.class_id)) {
            const [existingYearEnrollment] = await connection.execute(`
                SELECT id
                FROM student_class_enrollments
                WHERE student_id = ? AND academic_year_id = ?
                  AND class_id <> ?
                LIMIT 1
                FOR UPDATE
            `, [id, targetClasses[0].academic_year_id, data.class_id]);
            if (existingYearEnrollment.length) {
                throw new Error("Mwanafunzi tayari ana enrollment nyingine kwenye academic year hii.");
            }
            await connection.execute(`
                UPDATE student_class_enrollments
                SET status = 'COMPLETED', completed_at = NOW()
                WHERE student_id = ? AND class_id = ? AND status = 'ACTIVE'
            `, [id, currentClassId]);
        }
        await connection.execute(`
            INSERT INTO student_class_enrollments (student_id, class_id, academic_year_id, status)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), completed_at = NULL
        `, [
            id,
            data.class_id,
            targetClasses[0].academic_year_id,
            data.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"
        ]);
        await connection.execute(
            "DELETE FROM student_subjects WHERE student_id = ? AND class_id = ?",
            [id, data.class_id]
        );
        for (const subjectId of data.subject_ids) {
            await connection.execute(`
                INSERT INTO student_subjects (student_id, class_id, subject_id)
                VALUES (?, ?, ?)
            `, [id, data.class_id, subjectId]);
        }
        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback().catch(() => {});
        throw error;
    } finally {
        connection.release();
    }
}

async function updateStudentStatus(id, status) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [students] = await connection.execute(
            "SELECT class_id FROM students WHERE id = ? FOR UPDATE",
            [id]
        );
        if (!students[0]) throw new Error("Mwanafunzi hakupatikana.");
        await ensureClassHasCapacity(connection, students[0].class_id, status, id);
        const [result] = await connection.execute(
            "UPDATE students SET status = ? WHERE id = ?",
            [status, id]
        );
        const enrollmentStatus = ["ACTIVE", "INACTIVE", "TRANSFERRED", "GRADUATED"].includes(status)
            ? status
            : "INACTIVE";
        await connection.execute(`
            UPDATE student_class_enrollments
            SET status = ?, completed_at = CASE WHEN ? = 'ACTIVE' THEN NULL ELSE NOW() END
            WHERE student_id = ? AND class_id = ?
        `, [enrollmentStatus, enrollmentStatus, id, students[0].class_id]);
        await connection.commit();
        return result.affectedRows;
    } catch (error) {
        await connection.rollback().catch(() => {});
        throw error;
    } finally {
        connection.release();
    }
}

async function getClassOptions(academicYear, formNumber) {
    let sql = `
        SELECT
            c.id,
            c.class_name,
            c.status,
            CAST(REPLACE(REPLACE(UPPER(f.form_name), 'FORM', ''), ' ', '') AS UNSIGNED) AS form_number,
            f.form_name,
            ay.year_label AS academic_year
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.status = 'ACTIVE'
    `;
    const params = [];
    if (academicYear) {
        sql += " AND ay.year_label = ?";
        params.push(String(academicYear).trim());
    }
    if (formNumber) {
        sql += " AND CAST(REPLACE(REPLACE(UPPER(f.form_name), 'FORM', ''), ' ', '') AS UNSIGNED) = ?";
        params.push(Number(formNumber));
    }
    sql += " ORDER BY ay.id DESC, f.form_name ASC, c.class_name ASC";

    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = {
    getStudents,
    getStudentById,
    getStudentByAdmissionNumber,
    findClassByName,
    findClassById,
    createStudent,
    updateStudent,
    updateStudentStatus,
    getClassOptions,
    getClassSubjectProfile,
    getStudentSubjectIds,
    getStudentScienceSubjects
};
