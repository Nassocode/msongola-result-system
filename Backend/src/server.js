const app = require("./app");
const pool = require("./config/database");

require("dotenv").config();

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL connected successfully");

        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
    console.error("❌ MySQL connection failed:");
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR CODE:", error.code);
    console.error("ERROR NUMBER:", error.errno);
    console.error("FULL ERROR:", error);
    process.exit(1);
}
}

startServer();