 const pool = require("../config/database");

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
        "ORDER BY id DESC";

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
    updateUser,
    updateUserStatus,
    updateUserPassword,
    usernameExists
};