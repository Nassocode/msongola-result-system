const pool = require("../config/database");

async function createAcademicYear(data) {
    const [result] = await pool.execute(`
        INSERT INTO academic_years (year_label, start_date, end_date, status)
        VALUES (?, ?, ?, 'INACTIVE')
    `, [data.year_label, data.start_date || null, data.end_date || null]);
    const [rows] = await pool.execute(`
        SELECT id, year_label, start_date, end_date, status
        FROM academic_years
        WHERE id = ?
    `, [result.insertId]);
    return rows[0];
}

async function activateAcademicYear(academicYearId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [yearRows] = await connection.execute(`
            SELECT id, status
            FROM academic_years
            WHERE id = ?
            FOR UPDATE
        `, [academicYearId]);
        const year = yearRows[0];
        if (!year) throw new Error("Academic year haijapatikana.");
        if (year.status === "CLOSED") throw new Error("Academic year iliyofungwa haiwezi kuanzishwa tena.");
        const [[{ active_classes: activeClasses }]] = await connection.execute(`
            SELECT COUNT(*) AS active_classes
            FROM classes
            WHERE academic_year_id = ? AND status = 'ACTIVE'
        `, [academicYearId]);
        if (Number(activeClasses) === 0) {
            throw new Error("Tengeneza madarasa ya mwaka huu kabla ya kuufanya kuwa active.");
        }
        const [[{ students_left: studentsLeft }]] = await connection.execute(`
            SELECT COUNT(*) AS students_left
            FROM students s
            INNER JOIN classes c ON c.id = s.class_id
            INNER JOIN academic_years ay ON ay.id = c.academic_year_id
            WHERE s.status = 'ACTIVE' AND ay.status = 'ACTIVE'
              AND ay.id <> ?
        `, [academicYearId]);
        if (Number(studentsLeft) > 0) {
            throw new Error(`Bado kuna wanafunzi hai ${studentsLeft} kwenye mwaka unaoendelea. Wahamishe au weka status sahihi kabla ya kubadilisha mwaka.`);
        }
        const [[{ open_examinations: openExaminations }]] = await connection.execute(`
            SELECT COUNT(*) AS open_examinations
            FROM examinations e
            INNER JOIN academic_years ay ON ay.id = e.academic_year_id
            WHERE ay.status = 'ACTIVE' AND ay.id <> ? AND e.status = 'OPEN'
        `, [academicYearId]);
        if (Number(openExaminations) > 0) {
            throw new Error("Funga mitihani iliyo wazi kwenye mwaka wa sasa kabla ya kubadilisha academic year.");
        }
        await connection.execute(`
            UPDATE academic_years
            SET status = CASE WHEN id = ? THEN 'ACTIVE' ELSE 'CLOSED' END
            WHERE status = 'ACTIVE' OR id = ?
        `, [academicYearId, academicYearId]);
        await connection.commit();
        const [rows] = await pool.execute(`
            SELECT id, year_label, status
            FROM academic_years
            WHERE id = ?
        `, [academicYearId]);
        return rows[0];
    } catch (error) {
        await connection.rollback().catch(() => {});
        throw error;
    } finally {
        connection.release();
    }
}

async function getPromotionOptions() {
    const [years] = await pool.execute(`
        SELECT id, year_label, status
        FROM academic_years
        ORDER BY id DESC
    `);
    const [classes] = await pool.execute(`
        SELECT c.id, c.class_name, c.form_id, c.academic_year_id, c.capacity,
               f.form_name, ay.year_label, ay.status AS year_status,
               COUNT(DISTINCT CASE
                   WHEN s.class_id = c.id AND s.status = 'ACTIVE'
                   THEN enrollment.student_id
               END) AS student_count
        FROM classes c
        INNER JOIN forms f ON f.id = c.form_id
        INNER JOIN academic_years ay ON ay.id = c.academic_year_id
        LEFT JOIN student_class_enrollments enrollment ON enrollment.class_id = c.id
        LEFT JOIN students s ON s.id = enrollment.student_id
        WHERE c.status = 'ACTIVE'
        GROUP BY c.id, c.class_name, c.form_id, c.academic_year_id, c.capacity,
                 f.form_name, ay.year_label, ay.status
        ORDER BY ay.id DESC, f.form_name, c.class_name
    `);
    return { years, classes };
}

async function getPromotionPreview(sourceClassId, targetClassId) {
    const [rows] = await pool.execute(`
        SELECT source.id AS source_class_id, source.class_name AS source_class_name,
               source.academic_year_id AS source_year_id, source_year.year_label AS source_year,
               target.id AS target_class_id, target.class_name AS target_class_name,
               target.academic_year_id AS target_year_id, target_year.year_label AS target_year,
               target.capacity AS target_capacity,
               source_form.form_name AS source_form, source_form.form_number AS source_form_number,
               target_form.form_name AS target_form, target_form.form_number AS target_form_number,
               target_year.status AS target_year_status
        FROM classes source
        INNER JOIN academic_years source_year ON source_year.id = source.academic_year_id
        INNER JOIN forms source_form ON source_form.id = source.form_id
        INNER JOIN classes target ON target.id = ?
        INNER JOIN academic_years target_year ON target_year.id = target.academic_year_id
        INNER JOIN forms target_form ON target_form.id = target.form_id
        WHERE source.id = ? AND source.status = 'ACTIVE' AND target.status = 'ACTIVE'
        LIMIT 1
    `, [targetClassId, sourceClassId]);
    const classes = rows[0];
    if (!classes) throw new Error("Darasa la mwanzo au la mwaka mpya halijapatikana.");
    if (Number(classes.source_year_id) === Number(classes.target_year_id)) {
        throw new Error("Chagua academic year tofauti kwa darasa la mwaka mpya.");
    }
    if (Number(classes.target_form_number) < Number(classes.source_form_number)) {
        throw new Error("Mwanafunzi hawezi kuhamishiwa form iliyo chini ya aliyopo.");
    }
    if (classes.target_year_status === "CLOSED") {
        throw new Error("Huwezi kuhamishia wanafunzi kwenye academic year iliyofungwa.");
    }

    const [students] = await pool.execute(`
        SELECT s.id, s.admission_number, s.first_name, s.middle_name, s.last_name,
               s.academic_stream, s.islamic_studies
        FROM students s
        WHERE s.class_id = ? AND s.status = 'ACTIVE'
        ORDER BY s.id
    `, [sourceClassId]);
    if (!students.length) throw new Error("Hakuna wanafunzi hai kwenye darasa la mwanzo.");

    const [[targetEnrollment]] = await pool.execute(`
        SELECT COUNT(*) AS student_count
        FROM student_class_enrollments
        WHERE class_id = ? AND status = 'ACTIVE'
    `, [targetClassId]);
    const studentIds = students.map((student) => Number(student.id));
    const placeholders = studentIds.map(() => "?").join(",");
    const [existingEnrollments] = await pool.execute(`
        SELECT enrollment.student_id, s.admission_number
        FROM student_class_enrollments enrollment
        INNER JOIN students s ON s.id = enrollment.student_id
        WHERE enrollment.academic_year_id = ?
          AND enrollment.student_id IN (${placeholders})
    `, [classes.target_year_id, ...studentIds]);
    const alreadyEnrolled = existingEnrollments.map((enrollment) => enrollment.admission_number);
    if (alreadyEnrolled.length) {
        throw new Error(`Baadhi ya wanafunzi tayari wana usajili kwenye mwaka ${classes.target_year}: ${alreadyEnrolled.slice(0, 5).join(", ")}.`);
    }
    if (classes.target_capacity !== null &&
        Number(targetEnrollment.student_count) + students.length > Number(classes.target_capacity)) {
        throw new Error(`Darasa la mwaka mpya litazidi uwezo wake wa wanafunzi ${classes.target_capacity}.`);
    }

    return {
        ...classes,
        student_count: students.length,
        target_enrollment_count: Number(targetEnrollment.student_count || 0),
        students
    };
}

async function promoteStudents(sourceClassId, targetClassId, students) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [targetRows] = await connection.execute(`
            SELECT c.id, c.capacity, c.academic_year_id, ay.status AS year_status
            FROM classes c
            INNER JOIN academic_years ay ON ay.id = c.academic_year_id
            WHERE c.id = ? AND c.status = 'ACTIVE'
            FOR UPDATE
        `, [targetClassId]);
        const target = targetRows[0];
        if (!target) throw new Error("Darasa la mwaka mpya halijapatikana.");
        if (target.year_status === "CLOSED") throw new Error("Academic year ya mwisho imefungwa.");

        const [sourceStudents] = await connection.execute(`
            SELECT id, academic_stream, islamic_studies
            FROM students
            WHERE class_id = ? AND status = 'ACTIVE'
            ORDER BY id
            FOR UPDATE
        `, [sourceClassId]);
        if (!sourceStudents.length) throw new Error("Hakuna wanafunzi hai kwenye darasa la mwanzo.");
        if (sourceStudents.length !== students.length ||
            sourceStudents.some((student, index) => Number(student.id) !== Number(students[index].student_id))) {
            throw new Error("Orodha ya wanafunzi imebadilika. Pakia upya taarifa kisha ujaribu tena.");
        }

        const ids = sourceStudents.map((student) => Number(student.id));
        const placeholders = ids.map(() => "?").join(",");
        const [existingEnrollments] = await connection.execute(`
            SELECT student_id
            FROM student_class_enrollments
            WHERE academic_year_id = ? AND student_id IN (${placeholders})
            FOR UPDATE
        `, [target.academic_year_id, ...ids]);
        if (existingEnrollments.length) {
            throw new Error("Mwanafunzi mmoja au zaidi tayari amesajiliwa kwenye mwaka mpya.");
        }

        const [[{ target_count: targetCount }]] = await connection.execute(`
            SELECT COUNT(*) AS target_count
            FROM student_class_enrollments
            WHERE class_id = ? AND status = 'ACTIVE'
        `, [targetClassId]);
        if (target.capacity !== null &&
            Number(targetCount) + students.length > Number(target.capacity)) {
            throw new Error(`Darasa la mwaka mpya litazidi uwezo wake wa wanafunzi ${target.capacity}.`);
        }

        for (const entry of students) {
            const id = Number(entry.student_id);
            const [sourceEnrollment] = await connection.execute(`
                SELECT id
                FROM student_class_enrollments
                WHERE student_id = ? AND class_id = ?
                FOR UPDATE
            `, [id, sourceClassId]);
            if (!sourceEnrollment.length) {
                throw new Error("Usajili wa sasa wa mwanafunzi haujapatikana. Hakikisha migration ya student enrollments imeendeshwa.");
            }
            await connection.execute(`
                UPDATE student_class_enrollments
                SET status = 'COMPLETED', completed_at = NOW()
                WHERE student_id = ? AND class_id = ? AND status = 'ACTIVE'
            `, [id, sourceClassId]);
            await connection.execute(`
                INSERT INTO student_class_enrollments
                    (student_id, class_id, academic_year_id, status, enrolled_at)
                VALUES (?, ?, ?, 'ACTIVE', NOW())
            `, [id, targetClassId, target.academic_year_id]);
            await connection.execute(`
                UPDATE students
                SET class_id = ?, academic_stream = ?, islamic_studies = ?
                WHERE id = ?
            `, [targetClassId, entry.academic_stream, entry.islamic_studies ? 1 : 0, id]);
            for (const subjectId of entry.subject_ids) {
                await connection.execute(`
                    INSERT INTO student_subjects (student_id, class_id, subject_id)
                    VALUES (?, ?, ?)
                `, [id, targetClassId, subjectId]);
            }
        }

        await connection.commit();
        return { promoted_count: students.length };
    } catch (error) {
        await connection.rollback().catch(() => {});
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    activateAcademicYear,
    createAcademicYear,
    getPromotionOptions,
    getPromotionPreview,
    promoteStudents
};
