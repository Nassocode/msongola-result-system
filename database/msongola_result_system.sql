-- ============================================================
-- MSONGOLA SECONDARY SCHOOL RESULT SYSTEM
-- Database: MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS msongola_result_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE msongola_result_system;


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    role ENUM(
        'ADMIN',
        'ACADEMIC_MASTER',
        'TEACHER'
    ) NOT NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. TEACHERS
-- ============================================================

CREATE TABLE teachers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL UNIQUE,

    teacher_number VARCHAR(50) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,

    gender ENUM(
        'MALE',
        'FEMALE'
    ) NULL,

    phone VARCHAR(30) NULL,
    email VARCHAR(150) NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_teachers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 3. FORMS
-- ============================================================

CREATE TABLE forms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    form_number TINYINT UNSIGNED NOT NULL UNIQUE,

    form_name VARCHAR(50) NOT NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 4. ACADEMIC YEARS
-- ============================================================

CREATE TABLE academic_years (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    year_label VARCHAR(20) NOT NULL UNIQUE,

    start_date DATE NULL,
    end_date DATE NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'CLOSED'
    ) NOT NULL DEFAULT 'INACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 5. SCHOOL SETTINGS
-- ============================================================

CREATE TABLE school_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    school_name VARCHAR(200) NOT NULL,
    po_box VARCHAR(100) NULL,
    motto VARCHAR(255) NULL,

    head_of_school VARCHAR(200) NULL,

    academic_master_user_id BIGINT UNSIGNED NULL,

    phone VARCHAR(30) NULL,
    email VARCHAR(150) NULL,

    logo_path VARCHAR(500) NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_school_settings_academic_master
        FOREIGN KEY (academic_master_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- ============================================================
-- 6. SUBJECTS
-- ============================================================

CREATE TABLE subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    subject_code VARCHAR(30) NOT NULL UNIQUE,

    subject_name VARCHAR(150) NOT NULL UNIQUE,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 7. CLASSES
-- ============================================================

CREATE TABLE classes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    form_id BIGINT UNSIGNED NOT NULL,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    class_name VARCHAR(50) NOT NULL,

    capacity INT UNSIGNED NULL DEFAULT 150,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_classes_form
        FOREIGN KEY (form_id)
        REFERENCES forms(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_classes_academic_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_class_year
        UNIQUE (academic_year_id, class_name)
);


-- ============================================================
-- 8. FORM SUBJECTS
-- ============================================================

CREATE TABLE form_subjects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    form_id BIGINT UNSIGNED NOT NULL,

    subject_id BIGINT UNSIGNED NOT NULL,

    is_compulsory BOOLEAN NOT NULL DEFAULT TRUE,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_form_subjects_form
        FOREIGN KEY (form_id)
        REFERENCES forms(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_form_subjects_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_form_subject
        UNIQUE (form_id, subject_id)
);


-- ============================================================
-- 9. EXAMINATIONS
-- ============================================================

CREATE TABLE examinations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    exam_name VARCHAR(150) NOT NULL,

    exam_type ENUM(
        'MID_TERM',
        'TERMINAL',
        'ANNUAL',
        'OTHER'
    ) NOT NULL DEFAULT 'OTHER',

    term VARCHAR(50) NULL,

    start_date DATE NULL,
    end_date DATE NULL,

    status ENUM(
        'DRAFT',
        'OPEN',
        'CLOSED'
    ) NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_examinations_academic_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 10. TEACHER ASSIGNMENTS
-- ============================================================

CREATE TABLE teacher_assignments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    teacher_id BIGINT UNSIGNED NOT NULL,

    class_id BIGINT UNSIGNED NOT NULL,

    subject_id BIGINT UNSIGNED NOT NULL,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_teacher_assignments_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_teacher_assignments_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_teacher_assignments_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_teacher_assignments_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_teacher_assignment
        UNIQUE (
            teacher_id,
            class_id,
            subject_id,
            academic_year_id
        )
);


-- ============================================================
-- 11. CLASS TEACHER ASSIGNMENTS
-- ============================================================

CREATE TABLE class_teachers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    teacher_id BIGINT UNSIGNED NOT NULL,

    class_id BIGINT UNSIGNED NOT NULL,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_class_teacher_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_teacher_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_class_teacher_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_class_teacher_year
        UNIQUE (
            class_id,
            academic_year_id
        )
);


-- ============================================================
-- 11A. FORM COORDINATOR ASSIGNMENTS
-- One coordinator oversees every class section in a form/year.
-- ============================================================

CREATE TABLE form_coordinators (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    teacher_id BIGINT UNSIGNED NOT NULL,

    form_id BIGINT UNSIGNED NOT NULL,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_form_coordinator_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_form_coordinator_form
        FOREIGN KEY (form_id)
        REFERENCES forms(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_form_coordinator_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_form_coordinator_year
        UNIQUE (
            form_id,
            academic_year_id
        )
);


-- ============================================================
-- 12. GRADING RULES
-- ============================================================

CREATE TABLE grading_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    academic_year_id BIGINT UNSIGNED NOT NULL,

    grade CHAR(1) NOT NULL,

    min_mark DECIMAL(5,2) NOT NULL,
    max_mark DECIMAL(5,2) NOT NULL,

    points TINYINT UNSIGNED NOT NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_grading_rules_year
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_grading_year_grade
        UNIQUE (academic_year_id, grade)
);


-- ============================================================
-- 13. STUDENTS
-- ============================================================

CREATE TABLE students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    admission_number VARCHAR(50) NOT NULL UNIQUE,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,

    gender ENUM(
        'MALE',
        'FEMALE'
    ) NULL,

    date_of_birth DATE NULL,

    class_id BIGINT UNSIGNED NOT NULL,

    admission_date DATE NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE',
        'GRADUATED',
        'TRANSFERRED'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_students_class
        FOREIGN KEY (class_id)
        REFERENCES classes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 14. MARKS
-- ============================================================

CREATE TABLE marks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT UNSIGNED NOT NULL,

    subject_id BIGINT UNSIGNED NOT NULL,

    examination_id BIGINT UNSIGNED NOT NULL,

    teacher_assignment_id BIGINT UNSIGNED NOT NULL,

    marks DECIMAL(5,2) NOT NULL,

    grade CHAR(1) NULL,

    points TINYINT UNSIGNED NULL,

    status ENUM(
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'RETURNED'
    ) NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_marks_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_marks_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_marks_examination
        FOREIGN KEY (examination_id)
        REFERENCES examinations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_marks_teacher_assignment
        FOREIGN KEY (teacher_assignment_id)
        REFERENCES teacher_assignments(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_student_subject_exam
        UNIQUE (
            student_id,
            subject_id,
            examination_id
        ),

    CONSTRAINT chk_marks_range
        CHECK (marks >= 0 AND marks <= 100)
);


-- ============================================================
-- 15. MARK SUBMISSIONS
-- ============================================================

CREATE TABLE mark_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    teacher_assignment_id BIGINT UNSIGNED NOT NULL,

    examination_id BIGINT UNSIGNED NOT NULL,

    submitted_by BIGINT UNSIGNED NOT NULL,

    submitted_at DATETIME NULL,

    reviewed_by BIGINT UNSIGNED NULL,

    reviewed_at DATETIME NULL,

    status ENUM(
        'DRAFT',
        'SUBMITTED',
        'APPROVED',
        'RETURNED'
    ) NOT NULL DEFAULT 'DRAFT',

    review_comment TEXT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_submissions_assignment
        FOREIGN KEY (teacher_assignment_id)
        REFERENCES teacher_assignments(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_submissions_exam
        FOREIGN KEY (examination_id)
        REFERENCES examinations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_submissions_submitter
        FOREIGN KEY (submitted_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_submissions_reviewer
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_submission_assignment_exam
        UNIQUE (
            teacher_assignment_id,
            examination_id
        )
);


-- ============================================================
-- 16. RESULTS
-- ============================================================

CREATE TABLE results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT UNSIGNED NOT NULL,

    examination_id BIGINT UNSIGNED NOT NULL,

    total_marks DECIMAL(8,2) NOT NULL DEFAULT 0,

    average_marks DECIMAL(6,2) NOT NULL DEFAULT 0,

    total_points INT UNSIGNED NOT NULL DEFAULT 0,

    division VARCHAR(20) NULL,

    position INT UNSIGNED NULL,

    status ENUM(
        'DRAFT',
        'PROCESSED',
        'APPROVED'
    ) NOT NULL DEFAULT 'DRAFT',

    processed_by BIGINT UNSIGNED NULL,

    processed_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_results_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_results_exam
        FOREIGN KEY (examination_id)
        REFERENCES examinations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_results_processed_by
        FOREIGN KEY (processed_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT uq_student_exam_result
        UNIQUE (
            student_id,
            examination_id
        )
);


-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    sender_user_id BIGINT UNSIGNED NULL,

    recipient_user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM_MESSAGE',

    reference_type VARCHAR(50) NULL,

    reference_id BIGINT UNSIGNED NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    read_at DATETIME NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_sender
        FOREIGN KEY (sender_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT fk_notifications_recipient
        FOREIGN KEY (recipient_user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 18. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NULL,

    action VARCHAR(100) NOT NULL,

    module VARCHAR(100) NOT NULL,

    record_id BIGINT UNSIGNED NULL,

    old_values JSON NULL,

    new_values JSON NULL,

    ip_address VARCHAR(45) NULL,

    user_agent VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- ============================================================
-- 19. REPORT CARDS
-- ============================================================

CREATE TABLE report_cards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    student_id BIGINT UNSIGNED NOT NULL,

    examination_id BIGINT UNSIGNED NOT NULL,

    result_id BIGINT UNSIGNED NOT NULL,

    generated_by BIGINT UNSIGNED NOT NULL,

    generated_at DATETIME NULL,

    approved_at DATETIME NULL,

    status ENUM(
        'DRAFT',
        'GENERATED',
        'APPROVED'
    ) NOT NULL DEFAULT 'DRAFT',

    pdf_path VARCHAR(500) NULL,

    excel_path VARCHAR(500) NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_cards_student
        FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_report_cards_exam
        FOREIGN KEY (examination_id)
        REFERENCES examinations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_report_cards_result
        FOREIGN KEY (result_id)
        REFERENCES results(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_report_cards_generated_by
        FOREIGN KEY (generated_by)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_report_student_exam
        UNIQUE (
            student_id,
            examination_id
        )
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_students_class
    ON students(class_id);

CREATE INDEX idx_classes_form
    ON classes(form_id);

CREATE INDEX idx_classes_year
    ON classes(academic_year_id);

CREATE INDEX idx_teacher_assignments_teacher
    ON teacher_assignments(teacher_id);

CREATE INDEX idx_teacher_assignments_class
    ON teacher_assignments(class_id);

CREATE INDEX idx_teacher_assignments_subject
    ON teacher_assignments(subject_id);

CREATE INDEX idx_marks_student
    ON marks(student_id);

CREATE INDEX idx_marks_exam
    ON marks(examination_id);

CREATE INDEX idx_marks_status
    ON marks(status);

CREATE INDEX idx_submissions_status
    ON mark_submissions(status);

CREATE INDEX idx_results_exam
    ON results(examination_id);

CREATE INDEX idx_results_division
    ON results(division);

CREATE INDEX idx_notifications_recipient
    ON notifications(recipient_user_id);

CREATE INDEX idx_notifications_read
    ON notifications(is_read);

CREATE INDEX idx_audit_logs_user
    ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_module
    ON audit_logs(module);


-- ============================================================
-- SEED DATA
-- ============================================================

-- FORMS
INSERT INTO forms (form_number, form_name)
VALUES
(1, 'Form 1'),
(2, 'Form 2'),
(3, 'Form 3'),
(4, 'Form 4');


-- ACADEMIC YEAR
INSERT INTO academic_years
(
    year_label,
    start_date,
    end_date,
    status
)
VALUES
(
    '2026',
    '2026-01-01',
    '2026-12-31',
    'ACTIVE'
);


-- SAMPLE SUBJECTS
-- These are placeholders until the official school subject list
-- is provided.

INSERT INTO subjects
(
    subject_code,
    subject_name
)
VALUES
('MAT', 'Mathematics'),
('ENG', 'English'),
('KIS', 'Kiswahili'),
('BIO', 'Biology'),
('CHE', 'Chemistry'),
('PHY', 'Physics'),
('GEO', 'Geography'),
('HIS', 'History');


-- FORM SUBJECTS
-- Temporary example mapping.
-- Replace/update according to the official school curriculum.

INSERT INTO form_subjects
(
    form_id,
    subject_id,
    is_compulsory
)
SELECT f.id, s.id, TRUE
FROM forms f
CROSS JOIN subjects s
WHERE f.form_number IN (1, 2);


-- GRADING RULES FOR 2026

INSERT INTO grading_rules
(
    academic_year_id,
    grade,
    min_mark,
    max_mark,
    points
)
SELECT
    ay.id,
    g.grade,
    g.min_mark,
    g.max_mark,
    g.points
FROM academic_years ay
CROSS JOIN
(
    SELECT 'A' AS grade, 75.00 AS min_mark, 100.00 AS max_mark, 1 AS points
    UNION ALL
    SELECT 'B', 65.00, 74.00, 2
    UNION ALL
    SELECT 'C', 45.00, 64.00, 3
    UNION ALL
    SELECT 'D', 30.00, 44.00, 4
    UNION ALL
    SELECT 'F', 0.00, 29.00, 5
) g
WHERE ay.year_label = '2026';


-- SCHOOL PROFILE

INSERT INTO school_settings
(
    school_name,
    po_box,
    motto,
    head_of_school,
    status
)
VALUES
(
    'MSONGOLA SECONDARY SCHOOL',
    'P.O BOX 104727',
    'Education is Light',
    'NASSORO SHEKULAMBA',
    'ACTIVE'
);


-- ============================================================
-- END OF DATABASE SCRIPT
-- ============================================================