const pool = require("../config/database");

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
    const [result] = await pool.execute(`
        INSERT INTO teachers
            (user_id, teacher_number, first_name, middle_name, last_name, gender, phone, email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        data.user_id,
        data.teacher_number,
        data.first_name,
        data.middle_name || null,
        data.last_name,
        data.gender || null,
        data.phone || null,
        data.email || null,
        data.status || "ACTIVE"
    ]);
    return result.insertId;
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

async function createClass(data) {
    const [result] = await pool.execute(`
        INSERT INTO classes (form_id, academic_year_id, class_name, capacity, status)
        VALUES (?, ?, ?, ?, ?)
    `, [data.form_id, data.academic_year_id, data.class_name, data.capacity || null, data.status || "ACTIVE"]);
    return result.insertId;
}

async function getAssignments() {
    const [rows] = await pool.execute(`
        SELECT
            ta.id,
            ta.status,
            t.teacher_number,
            CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name,
            c.class_name,
            s.subject_code,
            s.subject_name,
            ay.year_label AS academic_year
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.id = ta.teacher_id
        INNER JOIN classes c ON c.id = ta.class_id
        INNER JOIN subjects s ON s.id = ta.subject_id
        INNER JOIN academic_years ay ON ay.id = ta.academic_year_id
        ORDER BY ta.created_at DESC
    `);
    return rows;
}

async function getAssignmentOptions() {
    const [teachers] = await pool.execute(`SELECT id, teacher_number, CONCAT_WS(' ', first_name, middle_name, last_name) AS teacher_name FROM teachers WHERE status = 'ACTIVE' ORDER BY first_name, last_name`);
    const [classes] = await pool.execute(`SELECT id, class_name, academic_year_id FROM classes WHERE status = 'ACTIVE' ORDER BY class_name`);
    const [subjects] = await pool.execute(`SELECT id, subject_code, subject_name FROM subjects WHERE status = 'ACTIVE' ORDER BY id ASC`);
    const [years] = await pool.execute(`SELECT id, year_label FROM academic_years WHERE status IN ('ACTIVE', 'INACTIVE') ORDER BY id DESC`);
    return { teachers, classes, subjects, years };
}

async function createAssignment(data) {
    const [result] = await pool.execute(`
        INSERT INTO teacher_assignments (teacher_id, class_id, subject_id, academic_year_id, status)
        VALUES (?, ?, ?, ?, ?)
    `, [data.teacher_id, data.class_id, data.subject_id, data.academic_year_id, data.status || 'ACTIVE']);
    return result.insertId;
}

async function updateCatalogStatus(resource, id, status) {
    const tables = {
        teachers: "teachers",
        subjects: "subjects",
        classes: "classes",
        assignments: "teacher_assignments"
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
    getAssignments,
    getAssignmentOptions,
    createAssignment,
    updateCatalogStatus
};
