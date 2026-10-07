const pool = require("../config/database");

async function getTeacherDashboard(userId) {
    const teacherSql = `
        SELECT
            t.id,
            t.teacher_number,
            t.first_name,
            t.middle_name,
            t.last_name,
            t.status,
            u.created_at AS account_created_at,
            u.updated_at AS account_updated_at
        FROM teachers t
        INNER JOIN users u ON u.id = t.user_id
        WHERE t.user_id = ?
        LIMIT 1
    `;

    const assignmentSql = `
        SELECT
            ta.id,
            c.class_name,
            f.form_name,
            s.subject_name,
            ay.year_label AS academic_year,
            ta.status
        FROM teacher_assignments ta
        INNER JOIN teachers t ON t.id = ta.teacher_id
        INNER JOIN classes c ON c.id = ta.class_id
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN subjects s ON s.id = ta.subject_id
        INNER JOIN academic_years ay ON ay.id = ta.academic_year_id
        WHERE t.user_id = ?
          AND ta.status = 'ACTIVE'
        ORDER BY ay.id DESC, c.class_name, s.id ASC
    `;

    const submissionSql = `
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN ms.status = 'DRAFT' THEN 1 ELSE 0 END) AS draft,
            SUM(CASE WHEN ms.status = 'SUBMITTED' THEN 1 ELSE 0 END) AS submitted,
            SUM(CASE WHEN ms.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN ms.status = 'RETURNED' THEN 1 ELSE 0 END) AS returned
        FROM mark_submissions ms
        WHERE ms.submitted_by = ?
    `;

    const [[teacherRows], [assignmentRows], [submissionRows]] = await Promise.all([
        pool.execute(teacherSql, [userId]),
        pool.execute(assignmentSql, [userId]),
        pool.execute(submissionSql, [userId])
    ]);

    const teacher = teacherRows[0] || null;
    const submission = submissionRows[0] || {};

    return {
        teacher,
        assignments: assignmentRows,
        statistics: {
            assignments: assignmentRows.length,
            total_submissions: Number(submission.total || 0),
            draft_submissions: Number(submission.draft || 0),
            submitted_submissions: Number(submission.submitted || 0),
            approved_submissions: Number(submission.approved || 0),
            returned_submissions: Number(submission.returned || 0)
        }
    };
}

module.exports = {
    getTeacherDashboard
};
