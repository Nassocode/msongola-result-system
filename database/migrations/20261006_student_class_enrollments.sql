CREATE TABLE IF NOT EXISTS student_class_enrollments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NOT NULL,
    academic_year_id BIGINT UNSIGNED NOT NULL,
    status ENUM(
        'ACTIVE',
        'COMPLETED',
        'INACTIVE',
        'TRANSFERRED',
        'GRADUATED'
    ) NOT NULL DEFAULT 'ACTIVE',
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_academic_year_enrollment UNIQUE (student_id, academic_year_id),
    CONSTRAINT fk_student_enrollment_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_student_enrollment_class
        FOREIGN KEY (class_id) REFERENCES classes(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_student_enrollment_year
        FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_student_enrollment_class_year (class_id, academic_year_id, status),
    INDEX idx_student_enrollment_student_year (student_id, academic_year_id)
);

INSERT IGNORE INTO student_class_enrollments
    (student_id, class_id, academic_year_id, status, enrolled_at, completed_at)
SELECT s.id, s.class_id, c.academic_year_id,
       CASE
           WHEN s.status = 'ACTIVE' THEN 'ACTIVE'
           WHEN s.status = 'INACTIVE' THEN 'INACTIVE'
           WHEN s.status = 'TRANSFERRED' THEN 'TRANSFERRED'
           WHEN s.status = 'GRADUATED' THEN 'GRADUATED'
       END,
       s.created_at,
       CASE WHEN s.status = 'ACTIVE' THEN NULL ELSE s.updated_at END
FROM students s
INNER JOIN classes c ON c.id = s.class_id;

INSERT IGNORE INTO student_class_enrollments
    (student_id, class_id, academic_year_id, status, enrolled_at, completed_at)
SELECT DISTINCT ss.student_id, ss.class_id, c.academic_year_id, 'COMPLETED',
       s.created_at, s.updated_at
FROM student_subjects ss
INNER JOIN students s ON s.id = ss.student_id
INNER JOIN classes c ON c.id = ss.class_id
WHERE NOT EXISTS (
    SELECT 1
    FROM student_class_enrollments current_enrollment
    WHERE current_enrollment.student_id = ss.student_id
      AND current_enrollment.academic_year_id = c.academic_year_id
);
