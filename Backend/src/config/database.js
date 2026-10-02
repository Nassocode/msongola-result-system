const mysql = require("mysql2/promise");
const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const poolConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// TiDB Cloud requires SSL
if (process.env.DB_SSL === "true") {
    poolConfig.ssl = {
        rejectUnauthorized: true
    };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool;
