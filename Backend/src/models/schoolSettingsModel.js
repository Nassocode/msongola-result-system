const pool = require("../config/database");

// GET ACTIVE SCHOOL SETTINGS
async function getSchoolSettings() {
    const sql = `
        SELECT
            id,
            school_name,
            po_box,
            motto,
            head_of_school,
            academic_master_user_id,
            phone,
            email,
            logo_path,
            status,
            created_at,
            updated_at
        FROM school_settings
        WHERE status = 'ACTIVE'
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] = await pool.execute(sql);

    return rows[0];
}


// GET SCHOOL SETTINGS BY ID
async function getSchoolSettingsById(id) {
    const sql = `
        SELECT
            id,
            school_name,
            po_box,
            motto,
            head_of_school,
            academic_master_user_id,
            phone,
            email,
            logo_path,
            status,
            created_at,
            updated_at
        FROM school_settings
        WHERE id = ?
        LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [id]);

    return rows[0];
}


// CREATE SCHOOL SETTINGS
async function createSchoolSettings(data) {
    const {
        school_name,
        po_box,
        motto,
        head_of_school,
        academic_master_user_id,
        phone,
        email,
        logo_path,
        status = "ACTIVE"
    } = data;

    const sql = `
        INSERT INTO school_settings
        (
            school_name,
            po_box,
            motto,
            head_of_school,
            academic_master_user_id,
            phone,
            email,
            logo_path,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
        school_name,
        po_box,
        motto,
        head_of_school,
        academic_master_user_id,
        phone,
        email,
        logo_path,
        status
    ]);

    return result.insertId;
}


// UPDATE SCHOOL SETTINGS
async function updateSchoolSettings(id, data) {
    const {
        school_name,
        po_box,
        motto,
        head_of_school,
        academic_master_user_id,
        phone,
        email,
        logo_path,
        status
    } = data;

    const sql = `
        UPDATE school_settings
        SET
            school_name = ?,
            po_box = ?,
            motto = ?,
            head_of_school = ?,
            academic_master_user_id = ?,
            phone = ?,
            email = ?,
            logo_path = ?,
            status = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [
        school_name,
        po_box,
        motto,
        head_of_school,
        academic_master_user_id,
        phone,
        email,
        logo_path,
        status,
        id
    ]);

    return result.affectedRows;
}


// UPDATE SCHOOL LOGO
async function updateSchoolLogo(id, logo_path) {
    const sql = `
        UPDATE school_settings
        SET
            logo_path = ?
        WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [
        logo_path,
        id
    ]);

    return result.affectedRows;
}


module.exports = {
    getSchoolSettings,
    getSchoolSettingsById,
    createSchoolSettings,
    updateSchoolSettings,
    updateSchoolLogo
};