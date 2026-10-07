const pool = require("../config/database");

async function getEntryContext(userId, assignmentId, examinationId) {
	const connection = await pool.getConnection();
	try {
		const [assignments] = await connection.execute(`
			SELECT ta.id, ta.teacher_id, ta.class_id, ta.subject_id, ta.academic_year_id,
				   c.class_name, f.form_name, s.subject_name, ay.year_label AS academic_year
			FROM teacher_assignments ta
			INNER JOIN teachers t ON t.id = ta.teacher_id
			INNER JOIN classes c ON c.id = ta.class_id
			INNER JOIN forms f ON f.id = c.form_id
			INNER JOIN subjects s ON s.id = ta.subject_id
			INNER JOIN academic_years ay ON ay.id = ta.academic_year_id
			WHERE ta.id = ? AND t.user_id = ? AND ta.status = 'ACTIVE'
			LIMIT 1
		`, [assignmentId, userId]);

		const assignment = assignments[0];
		if (!assignment) throw new Error("Assignment haipo au huna ruhusa kuitumia.");

		const [examinations] = await connection.execute(`
			SELECT id, exam_name, exam_type, term, start_date, end_date, status
			FROM examinations
			WHERE academic_year_id = ? AND status = 'OPEN'
			  AND (? IS NULL OR id = ?)
			ORDER BY id DESC
		`, [assignment.academic_year_id, examinationId || null, examinationId || null]);

		if (examinationId && !examinations.length) throw new Error("Mtihani haujafunguliwa kwa assignment hii.");

		let students = [];
		let marks = [];
		let submission = null;
		const selectedExamId = examinationId || examinations[0]?.id;

		if (selectedExamId) {
			const [studentRows] = await connection.execute(`
				SELECT s.id, s.admission_number, s.first_name, s.middle_name, s.last_name,
					   EXISTS (
						   SELECT 1 FROM student_subjects ss
						   WHERE ss.student_id = s.id
							 AND ss.class_id = s.class_id
							 AND ss.subject_id = ?
					   ) AS subject_eligible
				FROM students s
				WHERE s.class_id = ? AND s.status = 'ACTIVE'
				ORDER BY s.id ASC
			`, [assignment.subject_id, assignment.class_id]);
			students = studentRows;

			const [markRows] = await connection.execute(`
				SELECT student_id, marks, status
				FROM marks
				WHERE teacher_assignment_id = ? AND examination_id = ?
			`, [assignmentId, selectedExamId]);
			marks = markRows;

			const [submissionRows] = await connection.execute(`
				SELECT id, status, submitted_at, review_comment
				FROM mark_submissions
				WHERE teacher_assignment_id = ? AND examination_id = ?
				LIMIT 1
			`, [assignmentId, selectedExamId]);
			submission = submissionRows[0] || null;
		}

		return { assignment, examinations, examination_id: selectedExamId || null, students, marks, submission };
	} finally {
		connection.release();
	}
}

async function saveDraftMarks(userId, assignmentId, examinationId, entries) {
	const connection = await pool.getConnection();
	try {
		await connection.beginTransaction();
		const [owners] = await connection.execute(`
			SELECT ta.id, ta.class_id, ta.subject_id
			FROM teacher_assignments ta
			INNER JOIN teachers t ON t.id = ta.teacher_id
			WHERE ta.id = ? AND t.user_id = ? AND ta.status = 'ACTIVE'
			LIMIT 1
		`, [assignmentId, userId]);
		const assignment = owners[0];
		if (!assignment) throw new Error("Assignment haipo au huna ruhusa kuitumia.");

		const [exams] = await connection.execute(`
			SELECT id FROM examinations
			WHERE id = ? AND academic_year_id = (
				SELECT academic_year_id FROM teacher_assignments WHERE id = ?
			) AND status = 'OPEN'
			LIMIT 1
		`, [examinationId, assignmentId]);
		if (!exams.length) throw new Error("Mtihani haujafunguliwa.");

		const [existingMarks] = await connection.execute(`
			SELECT student_id, status
			FROM marks
			WHERE teacher_assignment_id = ? AND examination_id = ?
		`, [assignmentId, examinationId]);
		const existingByStudent = new Map(existingMarks.map((mark) => [Number(mark.student_id), mark]));
		for (const entry of entries) {
			const studentId = Number(entry.student_id);
			const existing = existingByStudent.get(studentId);
			if (existing && ["SUBMITTED", "APPROVED"].includes(existing.status)) {
				throw new Error("Mwanafunzi huyu tayari ametuma alama zake na haziwezi kuhaririwa.");
			}
		}

		const studentIds = [...new Set(entries.map((entry) => Number(entry.student_id)))];
		if (!studentIds.length || studentIds.some((id) => !Number.isInteger(id))) {
			throw new Error("Weka alama za wanafunzi halali.");
		}
		const placeholders = studentIds.map(() => "?").join(",");
		const [validStudents] = await connection.execute(
			`SELECT s.id
			 FROM students s
			 INNER JOIN student_subjects ss
			   ON ss.student_id = s.id
			  AND ss.class_id = s.class_id
			  AND ss.subject_id = ?
			 WHERE s.class_id = ? AND s.status = 'ACTIVE' AND s.id IN (${placeholders})`,
			[assignment.subject_id, assignment.class_id, ...studentIds]
		);
		if (validStudents.length !== studentIds.length) {
			throw new Error("Mwanafunzi mmoja au zaidi hayupo kwenye darasa hili au hasomi somo hili.");
		}

		for (const entry of entries) {
			const score = Number(entry.marks);
			if (!Number.isFinite(score) || score < 0 || score > 100) {
				throw new Error("Alama lazima ziwe kati ya 0 na 100.");
			}
			await connection.execute(`
				INSERT INTO marks (student_id, subject_id, examination_id, teacher_assignment_id, marks, status)
				VALUES (?, ?, ?, ?, ?, 'DRAFT')
				ON DUPLICATE KEY UPDATE marks = VALUES(marks), status = 'DRAFT'
			`, [Number(entry.student_id), assignment.subject_id, examinationId, assignmentId, score]);
		}
		await connection.commit();
		return { saved: entries.length };
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

async function submitMarks(userId, assignmentId, examinationId) {
	const connection = await pool.getConnection();
	let markedStudents = 0;
	try {
		await connection.beginTransaction();
		const [owners] = await connection.execute(`
			SELECT ta.id, ta.class_id, ta.subject_id
			FROM teacher_assignments ta
			INNER JOIN teachers t ON t.id = ta.teacher_id
			WHERE ta.id = ? AND t.user_id = ? AND ta.status = 'ACTIVE'
			LIMIT 1
		`, [assignmentId, userId]);
		const assignment = owners[0];
		if (!assignment) throw new Error("Assignment haipo au huna ruhusa kuitumia.");

		const [exams] = await connection.execute(`
			SELECT id FROM examinations
			WHERE id = ? AND academic_year_id = (
				SELECT academic_year_id FROM teacher_assignments WHERE id = ?
			) AND status = 'OPEN'
			LIMIT 1
		`, [examinationId, assignmentId]);
		if (!exams.length) throw new Error("Mtihani haujafunguliwa.");

		const [submissionRows] = await connection.execute(`
			SELECT status FROM mark_submissions
			WHERE teacher_assignment_id = ? AND examination_id = ? FOR UPDATE
		`, [assignmentId, examinationId]);
		const [[{ total_students: totalStudents }]] = await connection.execute(`
			SELECT COUNT(*) AS total_students
			FROM students s
			INNER JOIN student_subjects ss
			  ON ss.student_id = s.id
			 AND ss.class_id = s.class_id
			 AND ss.subject_id = ?
			WHERE s.class_id = ? AND s.status = 'ACTIVE'
		`, [assignment.subject_id, assignment.class_id]);
		if (Number(totalStudents) === 0) {
			throw new Error("Hakuna mwanafunzi aliyesajiliwa kusoma somo hili katika darasa hili.");
		}
		const [[{ required_students: requiredStudents }]] = await connection.execute(`
			SELECT COUNT(DISTINCT s.id) AS required_students
			FROM students s
			INNER JOIN student_subjects ss
			  ON ss.student_id = s.id
			 AND ss.class_id = s.class_id
			 AND ss.subject_id = ?
			LEFT JOIN marks m
			  ON m.student_id = s.id
			 AND m.teacher_assignment_id = ?
			 AND m.examination_id = ?
			WHERE s.class_id = ? AND s.status = 'ACTIVE'
			  AND (m.student_id IS NULL OR m.status IN ('DRAFT', 'RETURNED'))
		`, [assignment.subject_id, assignmentId, examinationId, assignment.class_id]);
		if (["SUBMITTED", "APPROVED"].includes(submissionRows[0]?.status) && Number(requiredStudents) === 0) {
			throw new Error("Alama hizi tayari zimetumwa kwa wanafunzi wote wa darasa hili.");
		}
		if (Number(requiredStudents) > 0) {
			const [[{ marked_students: markedStudents }]] = await connection.execute(`
				SELECT COUNT(DISTINCT s.id) AS marked_students
				FROM students s
				INNER JOIN student_subjects ss
				  ON ss.student_id = s.id
				 AND ss.class_id = s.class_id
				 AND ss.subject_id = ?
				LEFT JOIN marks m
				  ON m.student_id = s.id
				 AND m.teacher_assignment_id = ?
				 AND m.examination_id = ?
				WHERE s.class_id = ? AND s.status = 'ACTIVE'
				  AND m.student_id IS NOT NULL
				  AND m.status NOT IN ('SUBMITTED', 'APPROVED')
			`, [assignment.subject_id, assignmentId, examinationId, assignment.class_id]);
			if (Number(markedStudents) !== Number(requiredStudents)) {
				throw new Error(`Kamilisha alama za wanafunzi wote kabla ya kutuma (${markedStudents}/${requiredStudents}).`);
			}
		}

		await connection.execute(`
			UPDATE marks m
			INNER JOIN student_subjects ss
			  ON ss.student_id = m.student_id
			 AND ss.class_id = ?
			 AND ss.subject_id = m.subject_id
			SET m.status = 'SUBMITTED'
			WHERE m.teacher_assignment_id = ? AND m.examination_id = ?
		`, [assignment.class_id, assignmentId, examinationId]);
		await connection.execute(`
			INSERT INTO mark_submissions (teacher_assignment_id, examination_id, submitted_by, submitted_at, status)
			VALUES (?, ?, ?, NOW(), 'SUBMITTED')
			ON DUPLICATE KEY UPDATE submitted_by = VALUES(submitted_by), submitted_at = NOW(), status = 'SUBMITTED', review_comment = NULL
		`, [assignmentId, examinationId, userId]);

		await connection.commit();
		return { status: "SUBMITTED", marked_students: Number(markedStudents) };
	} catch (error) {
		await connection.rollback();
		throw error;
	} finally {
		connection.release();
	}
}

module.exports = { getEntryContext, saveDraftMarks, submitMarks };
