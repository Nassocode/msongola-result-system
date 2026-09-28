const pool = require("../config/database");

function normalizeClassName(value) {
    return String(value || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/^FORM_?/, "");
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
            c.id AS class_id,
            c.class_name,
            f.form_name,
            ay.year_label AS academic_year
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN forms f ON f.id = c.form_id
        LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
        ORDER BY s.created_at DESC
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
            c.id AS class_id,
            c.class_name,
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
            admission_date,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
        data.admission_number,
        data.first_name,
        data.middle_name || null,
        data.last_name,
        data.gender,
        data.date_of_birth || null,
        data.class_id,
        data.admission_date || null,
        data.status || "ACTIVE"
    ]);

    return result.insertId;
}

async function updateStudent(id, data) {
    const [result] = await pool.execute(`
        UPDATE students
        SET admission_number = ?, first_name = ?, middle_name = ?, last_name = ?,
            gender = ?, date_of_birth = ?, class_id = ?, admission_date = ?, status = ?
        WHERE id = ?
    `, [data.admission_number, data.first_name, data.middle_name || null, data.last_name,
        data.gender, data.date_of_birth || null, data.class_id, data.admission_date || null,
        data.status, id]);
    return result.affectedRows;
}

async function updateStudentStatus(id, status) {
    const [result] = await pool.execute("UPDATE students SET status = ? WHERE id = ?", [status, id]);
    return result.affectedRows;
}

async function getClassOptions() {
    const sql = `
        SELECT
            c.id,
            c.class_name,
            c.status,
            f.form_name,
            ay.year_label AS academic_year
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        WHERE c.status = 'ACTIVE'
        ORDER BY ay.id DESC, f.form_name ASC, c.class_name ASC
    `;

    const [rows] = await pool.execute(sql);
    return rows;
}

module.exports = {
    getStudents,
    getStudentById,
    getStudentByAdmissionNumber,
    findClassByName,
    createStudent,
    updateStudent,
    updateStudentStatus,
    getClassOptions
};
