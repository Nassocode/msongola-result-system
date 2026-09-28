const bcrypt = require("bcryptjs");
const pool = require("./src/config/database");

async function createAdmin() {

    const username = "admin";
    const password = "Admin@12345";

    try {

        // Check kama admin tayari yupo
        const [existingUsers] = await pool.execute(
            "SELECT id FROM users WHERE username = ? LIMIT 1",
            [username]
        );

        if (existingUsers.length > 0) {
            console.log("⚠️ Admin account tayari ipo.");
            process.exit(0);
        }

        // Tengeneza password hash
        const passwordHash = await bcrypt.hash(password, 12);

        // Save admin
        await pool.execute(
            `
            INSERT INTO users
            (username, password_hash, role, status)
            VALUES (?, ?, 'ADMIN', 'ACTIVE')
            `,
            [username, passwordHash]
        );

        console.log("=================================");
        console.log("✅ ADMIN ACCOUNT CREATED");
        console.log("=================================");
        console.log("Username:", username);
        console.log("Password:", password);
        console.log("Role: ADMIN");
        console.log("Status: ACTIVE");
        console.log("=================================");

    } catch (error) {

        console.error("❌ Failed to create admin:");
        console.error(error.message);

    } finally {

        await pool.end();

    }
}

createAdmin();