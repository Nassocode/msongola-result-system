const pool = require("../config/database");
const {
    createTemporaryIdentifier,
    createTeacherNumber
} = require("../utils/generatedIdentifiers");

async function getTeachers() {
    const [rows] = await pool.execute(`
        SELECT
            t.id,
            t.user_id,
            t.teacher_number,
            t.first_name,
            t.middle_name,
            t.last_name,
            t.gender,
            t.phone,
            t.email,
            t.status,
            u.username
        FROM teachers t
        INNER JOIN users u ON u.id = t.user_id
        ORDER BY t.created_at DESC
    `);
    return rows;
}

async function getTeacherUserOptions() {
    const [rows] = await pool.execute(`
        SELECT u.id, u.username
        FROM users u
        LEFT JOIN teachers t ON t.user_id = u.id
        WHERE u.role = 'SUBJECT_TEACHER'
          AND u.status = 'ACTIVE'
          AND t.id IS NULL
        ORDER BY u.username ASC
    `);
    return rows;
}

async function createTeacher(data) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [result] = await connection.execute(`
                INSERT INTO teachers
                    (user_id, teacher_number, first_name, middle_name, last_name, gender, phone, email, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                data.user_id,
                createTemporaryIdentifier(),
                data.first_name,
                data.middle_name || null,
                data.last_name,
                data.gender || null,
                data.phone || null,
                data.email || null,
                data.status || "ACTIVE"
            ]);
            const teacherNumber = createTeacherNumber(result.insertId);

            try {
                await connection.execute(
                    "UPDATE teachers SET teacher_number = ? WHERE id = ?",
                    [teacherNumber, result.insertId]
                );
            } catch (error) {
                if (error.code !== "ER_DUP_ENTRY" || attempt === 9) throw error;
                await connection.rollback();
                continue;
            }

            await connection.commit();
            return { id: result.insertId, teacher_number: teacherNumber };
        } catch (error) {
            await connection.rollback().catch(() => {});
            throw error;
        } finally {
            connection.release();
        }
    }

    throw new Error("Imeshindikana kutengeneza Teacher Number ya kipekee.");
}

async function getSubjects() {
    const [rows] = await pool.execute(`
        SELECT id, subject_code, subject_name, status, created_at, updated_at
        FROM subjects
        ORDER BY id ASC
    `);
    return rows;
}

async function createSubject(data) {
    const [result] = await pool.execute(`
        INSERT INTO subjects (subject_code, subject_name, status)
        VALUES (?, ?, ?)
    `, [data.subject_code, data.subject_name, data.status || "ACTIVE"]);
    return result.insertId;
}

async function getClasses() {
    const [rows] = await pool.execute(`
        SELECT
            c.id,
            c.class_name,
            c.capacity,
            c.status,
            c.form_id,
            f.form_name,
            ay.id AS academic_year_id,
            ay.year_label AS academic_year
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        ORDER BY ay.id DESC, f.form_name ASC, c.class_name ASC
    `);
    return rows;
}

async function getClassOptions() {
    const [forms] = await pool.execute(`
        SELECT id, form_name
        FROM forms
        WHERE status = 'ACTIVE'
        ORDER BY form_name ASC
    `);
    const [years] = await pool.execute(`
        SELECT id, year_label
        FROM academic_years
        WHERE status IN ('ACTIVE', 'INACTIVE')
        ORDER BY id DESC
    `);
    return { forms, years };
}

async function getClassTeachers() {
    const [rows] = await pool.execute(`
        SELECT ct.id, ct.teacher_id, ct.class_id, ct.academic_year_id, ct.status,
               c.class_name, f.form_name, ay.year_label AS academic_year,
               t.teacher_number,
               CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name
        FROM class_teachers ct
        INNER JOIN teachers t ON t.id = ct.teacher_id
        INNER JOIN classes c ON c.id = ct.class_id
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = ct.academic_year_id
        ORDER BY ay.id DESC, f.form_name, c.class_name
    `);
    return rows;
}

async function getClassTeacherOptions() {
    const [teachers] = await pool.execute(`
        SELECT id, teacher_number,
               CONCAT_WS(' ', first_name, middle_name, last_name) AS teacher_name
        FROM teachers WHERE status = 'ACTIVE'
        ORDER BY first_name, last_name
    `);
    const [classes] = await pool.execute(`
        SELECT c.id, c.class_name, c.academic_year_id,
               f.form_name, ay.year_label AS academic_year
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.status = 'ACTIVE'
        ORDER BY ay.id DESC, f.form_name, c.class_name
    `);
    const [years] = await pool.execute(`
        SELECT id, year_label FROM academic_years
        WHERE status IN ('ACTIVE', 'INACTIVE')
        ORDER BY id DESC
    `);
    return { teachers, classes, years };
}

async function createClassTeacher(data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [validRows] = await connection.execute(`
            SELECT c.id
            FROM classes c
            INNER JOIN teachers t ON t.id = ? AND t.status = 'ACTIVE'
            WHERE c.id = ? AND c.academic_year_id = ? AND c.status = 'ACTIVE'
            LIMIT 1
        `, [data.teacher_id, data.class_id, data.academic_year_id]);
        if (!validRows.length) throw new Error("Mwalimu, darasa na mwaka wa masomo havilingani au havipo active.");

        const [existing] = await connection.execute(`
            SELECT id FROM class_teachers
            WHERE class_id = ? AND academic_year_id = ?
            ORDER BY id DESC LIMIT 1 FOR UPDATE
        `, [data.class_id, data.academic_year_id]);
        if (existing[0]) {
            await connection.execute(`
                UPDATE class_teachers
                SET teacher_id = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
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

async function createClass(data) {
    const [result] = await pool.execute(`
        INSERT INTO classes (form_id, academic_year_id, class_name, capacity, status)
        VALUES (?, ?, ?, ?, ?)
    `, [data.form_id, data.academic_year_id, data.class_name, data.capacity ?? 150, data.status || "ACTIVE"]);
    return result.insertId;
}

async function getAssignments() {
    const [rows] = await pool.execute(`
        SELECT
            ta.id,
            ta.class_id,
            ta.academic_year_id,
            ta.status,
            t.teacher_number,
            CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name,
            c.class_name,
            f.form_name,
            s.subject_code,
            s.subject_name,
            ay.year_label AS academic_year
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.id = ta.teacher_id
        INNER JOIN classes c ON c.id = ta.class_id
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN subjects s ON s.id = ta.subject_id
        INNER JOIN academic_years ay ON ay.id = ta.academic_year_id
        ORDER BY ay.id DESC, f.form_name, c.class_name, s.subject_name,
             t.first_name, t.last_name
    `);
    return rows;
}

async function getAssignmentOptions() {
    const [teachers] = await pool.execute(`SELECT id, teacher_number, CONCAT_WS(' ', first_name, middle_name, last_name) AS teacher_name FROM teachers WHERE status = 'ACTIVE' ORDER BY first_name, last_name`);
    const [classes] = await pool.execute(`
        SELECT c.id, c.class_name, c.academic_year_id, f.form_name, ay.year_label AS academic_year
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.status = 'ACTIVE'
        ORDER BY ay.id DESC, f.form_name ASC, c.class_name ASC
    `);
    const [subjects] = await pool.execute(`SELECT id, subject_code, subject_name FROM subjects WHERE status = 'ACTIVE' ORDER BY id ASC`);
    const [years] = await pool.execute(`SELECT id, year_label FROM academic_years WHERE status IN ('ACTIVE', 'INACTIVE') ORDER BY id DESC`);
    return { teachers, classes, subjects, years };
}

async function createAssignment(data) {
    const [[matchingAssignment]] = await pool.execute(`
        SELECT c.id
        FROM classes c
        INNER JOIN teachers t ON t.id = ? AND t.status = 'ACTIVE'
        INNER JOIN subjects s ON s.id = ? AND s.status = 'ACTIVE'
        WHERE c.id = ? AND c.academic_year_id = ? AND c.status = 'ACTIVE'
        LIMIT 1
    `, [data.teacher_id, data.subject_id, data.class_id, data.academic_year_id]);
    if (!matchingAssignment) {
        throw new Error("Hakikisha mwalimu, somo, darasa na mwaka ni sahihi; darasa lazima liwe la mwaka uliochagua.");
    }

    const [result] = await pool.execute(`
        INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, academic_year_id, status)
        VALUES (?, ?, ?, ?, ?)
    `, [data.teacher_id, data.class_id, data.subject_id, data.academic_year_id, data.status || 'ACTIVE']);
    return result.insertId;
}

async function getFormCoordinators() {
    const [rows] = await pool.execute(`
        SELECT fc.id, fc.teacher_id, fc.form_id, fc.academic_year_id, fc.status,
               f.form_name, ay.year_label AS academic_year,
               t.teacher_number,
               CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name
        FROM form_coordinators fc
        INNER JOIN teachers t ON t.id = fc.teacher_id
        INNER JOIN forms f ON f.id = fc.form_id
        INNER JOIN academic_years ay ON ay.id = fc.academic_year_id
        ORDER BY ay.id DESC, f.form_name
    `);
    return rows;
}

async function getFormCoordinatorOptions() {
    const [teachers] = await pool.execute(`
        SELECT id, teacher_number,
               CONCAT_WS(' ', first_name, middle_name, last_name) AS teacher_name
        FROM teachers
        WHERE status = 'ACTIVE'
        ORDER BY first_name, last_name
    `);
    const [forms] = await pool.execute(`
        SELECT id, form_name
        FROM forms
        WHERE status = 'ACTIVE'
        ORDER BY form_name
    `);
    const [years] = await pool.execute(`
        SELECT id, year_label
        FROM academic_years
        WHERE status IN ('ACTIVE', 'INACTIVE')
        ORDER BY id DESC
    `);
    return { teachers, forms, years };
}

async function createFormCoordinator(data) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [validRows] = await connection.execute(`
            SELECT t.id AS teacher_id, f.id AS form_id, ay.id AS academic_year_id
            FROM teachers t
            CROSS JOIN forms f
            CROSS JOIN academic_years ay
            WHERE t.id = ? AND t.status = 'ACTIVE'
              AND f.id = ? AND f.status = 'ACTIVE'
              AND ay.id = ? AND ay.status IN ('ACTIVE', 'INACTIVE')
            LIMIT 1
        `, [data.teacher_id, data.form_id, data.academic_year_id]);
        if (!validRows.length) throw new Error("Mwalimu, form na mwaka lazima ziwe active na zilingane.");

        const [existing] = await connection.execute(`
            SELECT id FROM form_coordinators
            WHERE form_id = ? AND academic_year_id = ?
            LIMIT 1 FOR UPDATE
        `, [data.form_id, data.academic_year_id]);
        if (existing[0]) {
            await connection.execute(`
                UPDATE form_coordinators
                SET teacher_id = ?, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [data.teacher_id, existing[0].id]);
            await connection.commit();
            return Number(existing[0].id);
        }

        const [result] = await connection.execute(`
            INSERT INTO form_coordinators (teacher_id, form_id, academic_year_id, status)
            VALUES (?, ?, ?, 'ACTIVE')
        `, [data.teacher_id, data.form_id, data.academic_year_id]);
        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function updateCatalogStatus(resource, id, status) {
    const tables = {
        teachers: "teachers",
        subjects: "subjects",
        classes: "classes",
        assignments: "teacher_assignments",
        classTeachers: "class_teachers",
        formCoordinators: "form_coordinators"
    };
    const table = tables[resource];
    if (!table) throw new Error("Aina ya taarifa haijaruhusiwa.");
    const [result] = await pool.execute(`UPDATE ${table} SET status = ? WHERE id = ?`, [status, id]);
    return result.affectedRows;
}

module.exports = {
    getTeachers,
    getTeacherUserOptions,
    createTeacher,
    getSubjects,
    createSubject,
    getClasses,
    getClassOptions,
    createClass,
    getClassTeachers,
    getClassTeacherOptions,
    createClassTeacher,
    getAssignments,
    getAssignmentOptions,
    createAssignment,
    getFormCoordinators,
    getFormCoordinatorOptions,
    createFormCoordinator,
    updateCatalogStatus
};
