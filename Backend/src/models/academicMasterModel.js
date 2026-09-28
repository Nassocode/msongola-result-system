const pool = require("../config/database");


/* =========================================================
   GET TOTAL STUDENTS
   ========================================================= */

async function getTotalStudents() {

    const sql = `
        SELECT COUNT(*) AS total
        FROM students
        WHERE status = 'ACTIVE'
    `;

    const [rows] = await pool.execute(sql);

    return Number(rows[0].total);
}


/* =========================================================
   GET TOTAL TEACHERS
   ========================================================= */

async function getTotalTeachers() {

    const sql = `
        SELECT COUNT(*) AS total
        FROM teachers
        WHERE status = 'ACTIVE'
    `;

    const [rows] = await pool.execute(sql);

    return Number(rows[0].total);
}


/* =========================================================
   GET TOTAL CLASSES
   ========================================================= */

async function getTotalClasses() {

    const sql = `
        SELECT COUNT(*) AS total
        FROM classes
        WHERE status = 'ACTIVE'
    `;

    const [rows] = await pool.execute(sql);

    return Number(rows[0].total);
}


/* =========================================================
   GET TOTAL ACTIVE SUBJECTS
   ========================================================= */

async function getTotalSubjects() {

    const sql = `
        SELECT COUNT(*) AS total
        FROM subjects
        WHERE status = 'ACTIVE'
    `;

    const [rows] = await pool.execute(sql);

    return Number(rows[0].total);
}


/* =========================================================
   GET CURRENT ACADEMIC YEAR
   ========================================================= */

async function getCurrentAcademicYear() {

    const sql = `
        SELECT
            id,
            year_label,
            start_date,
            end_date,
            status
        FROM academic_years
        WHERE status = 'ACTIVE'
        ORDER BY id DESC
        LIMIT 1
    `;

    const [rows] = await pool.execute(sql);

    return rows[0] || null;
}


/* =========================================================
   GET ACTIVE / OPEN EXAMINATIONS
   ========================================================= */

async function getCurrentExaminations() {

    const sql = `
        SELECT
            e.id,
            e.exam_name,
            e.exam_type,
            e.term,
            e.start_date,
            e.end_date,
            e.status,
            e.academic_year_id,
            ay.year_label
        FROM examinations e
        INNER JOIN academic_years ay
            ON ay.id = e.academic_year_id
        WHERE e.status = 'OPEN'
        ORDER BY e.id DESC
    `;

    const [rows] = await pool.execute(sql);

    return rows;
}


/* =========================================================
   GET SUBMISSION STATISTICS
   ========================================================= */

async function getSubmissionStatistics() {

    const sql = `
        SELECT
            COUNT(*) AS total,
            SUM(
                CASE
                    WHEN status = 'DRAFT'
                    THEN 1
                    ELSE 0
                END
            ) AS draft,

            SUM(
                CASE
                    WHEN status = 'SUBMITTED'
                    THEN 1
                    ELSE 0
                END
            ) AS submitted,

            SUM(
                CASE
                    WHEN status = 'APPROVED'
                    THEN 1
                    ELSE 0
                END
            ) AS approved,

            SUM(
                CASE
                    WHEN status = 'RETURNED'
                    THEN 1
                    ELSE 0
                END
            ) AS returned

        FROM mark_submissions
    `;

    const [rows] = await pool.execute(sql);

    const result = rows[0];

    return {
        total: Number(result.total || 0),
        draft: Number(result.draft || 0),
        submitted: Number(result.submitted || 0),
        approved: Number(result.approved || 0),
        returned: Number(result.returned || 0)
    };
}


/* =========================================================
   GET ALL DASHBOARD COUNTS
   ========================================================= */

async function getDashboardStatistics() {

    const [
        students,
        teachers,
        classes,
        subjects,
        academicYear,
        examinations,
        submissions
    ] = await Promise.all([

        getTotalStudents(),

        getTotalTeachers(),

        getTotalClasses(),

        getTotalSubjects(),

        getCurrentAcademicYear(),

        getCurrentExaminations(),

        getSubmissionStatistics()

    ]);


    return {

        students,

        teachers,

        classes,

        subjects,

        academic_year: academicYear,

        examinations,

        submissions

    };
}


module.exports = {

    getTotalStudents,

    getTotalTeachers,

    getTotalClasses,

    getTotalSubjects,

    getCurrentAcademicYear,

    getCurrentExaminations,

    getSubmissionStatistics,

    getDashboardStatistics

};