const mysql = require("mysql2/promise");
require("dotenv").config({ path: "./Backend/.env" });

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "msongola_result_system"
  });

  for (const table of ["marks", "teacher_assignments", "class_teachers", "form_coordinators", "student_class_enrollments", "students", "classes", "examinations", "school_settings", "academic_years", "teachers"]) {
    try {
      const [cols] = await conn.query(`SHOW COLUMNS FROM ${table}`);
      console.log(`TABLE ${table}:`, cols.map(c => c.Field));
    } catch (e) {
      console.log(`TABLE ${table}: ERROR ${e.message}`);
    }
  }

  await conn.end();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
