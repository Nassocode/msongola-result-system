 const pool = require("../config/database");
const {
    createTemporaryIdentifier,
    createTeacherNumber
} = require("../utils/generatedIdentifiers");

// FIND USER BY USERNAME
async function findUserByUsername(username) {
    const sql =
        "SELECT id, username, password_hash, role, status, created_at, updated_at " +
        "FROM users " +
        "WHERE username = ? " +
        "LIMIT 1";

    const [rows] = await pool.execute(sql, [username]);

    return rows[0];
}


// GET ALL USERS
async function findAllUsers() {
    const sql =
        "SELECT id, username, role, status, created_at, updated_at " +
        "FROM users " +
        "WHERE UPPER(TRIM(role)) <> 'ADMIN' " +
        "ORDER BY id ASC";

    const [rows] = await pool.execute(sql);

    return rows;
}


// FIND USER BY ID
async function findUserById(id) {
    const sql =
        "SELECT id, username, role, status, created_at, updated_at " +
        "FROM users " +
        "WHERE id = ? " +
        "LIMIT 1";

    const [rows] = await pool.execute(sql, [id]);

    return rows[0];
}


// CREATE USER
async function createUser({
    username,
    passwordHash,
    role,
    status = "ACTIVE"
}) {
    const sql =
        "INSERT INTO users " +
        "(username, password_hash, role, status) " +
        "VALUES (?, ?, ?, ?)";

    const [result] = await pool.execute(sql, [
        username,
        passwordHash,
        role,
        status
    ]);

    return result.insertId;
}

async function createUserWithTeacher({
    username,
    passwordHash,
    status = "ACTIVE",
    firstName,
    middleName,
    lastName
}) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [userResult] = await connection.execute(`
            INSERT INTO users (username, password_hash, role, status)
            VALUES (?, ?, 'SUBJECT_TEACHER', ?)
        `, [username, passwordHash, status]);

        let teacherNumber;
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const [teacherResult] = await connection.execute(`
            INSERT INTO teachers (user_id, teacher_number, first_name, middle_name, last_name, status)
            VALUES (?, ?, ?, ?, ?, ?)
            `, [userResult.insertId, createTemporaryIdentifier(), firstName, middleName || null, lastName, status]);
            teacherNumber = createTeacherNumber(teacherResult.insertId);

            try {
                await connection.execute(
                    "UPDATE teachers SET teacher_number = ? WHERE id = ?",
                    [teacherNumber, teacherResult.insertId]
                );
                break;
            } catch (error) {
                if (error.code !== "ER_DUP_ENTRY" || attempt === 9) throw error;
                await connection.execute("DELETE FROM teachers WHERE id = ?", [teacherResult.insertId]);
            }
        }

        await connection.commit();
        return { userId: userResult.insertId, teacherNumber };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


// UPDATE USER
async function updateUser(id, username, role) {
    const sql =
        "UPDATE users " +
        "SET username = ?, role = ?, updated_at = CURRENT_TIMESTAMP " +
        "WHERE id = ?";

    const [result] = await pool.execute(sql, [
        username,
        role,
        id
    ]);

    return result.affectedRows;
}

async function updateUsername(id, username) {
    const [result] = await pool.execute(
        "UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [username, id]
    );

    return result.affectedRows;
}


// UPDATE USER STATUS
async function updateUserStatus(id, status) {
    const sql =
        "UPDATE users " +
        "SET status = ?, updated_at = CURRENT_TIMESTAMP " +
        "WHERE id = ?";

    const [result] = await pool.execute(sql, [
        status,
        id
    ]);

    return result.affectedRows;
}


// UPDATE PASSWORD
async function updateUserPassword(id, passwordHash) {
    const sql =
        "UPDATE users " +
        "SET password_hash = ?, updated_at = CURRENT_TIMESTAMP " +
        "WHERE id = ?";

    const [result] = await pool.execute(sql, [
        passwordHash,
        id
    ]);

    return result.affectedRows;
}

async function findPasswordHashById(id) {
    const [rows] = await pool.execute(
        "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
        [id]
    );
    return rows[0]?.password_hash || null;
}


// CHECK USERNAME EXISTS
async function usernameExists(username, excludeId = null) {
    let sql =
        "SELECT id FROM users WHERE username = ?";

    const params = [username];

    if (excludeId !== null) {
        sql += " AND id != ?";
        params.push(excludeId);
    }

    sql += " LIMIT 1";

    const [rows] = await pool.execute(sql, params);

    return rows.length > 0;
}


// EXPORT FUNCTIONS
module.exports = {
    findUserByUsername,
    findAllUsers,
    findUserById,
    createUser,
    createUserWithTeacher,
    updateUser,
    updateUsername,
    updateUserStatus,
    updateUserPassword,
    findPasswordHashById,
    usernameExists
};