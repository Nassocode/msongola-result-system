ALTER TABLE students
    ADD COLUMN academic_stream ENUM('GENERAL', 'ARTS', 'SCIENCE') NOT NULL DEFAULT 'GENERAL' AFTER class_id,
    ADD COLUMN islamic_studies BOOLEAN NOT NULL DEFAULT FALSE AFTER academic_stream;

CREATE TABLE student_subjects (
    student_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NOT NULL,
    subject_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (student_id, class_id, subject_id),
    CONSTRAINT fk_student_subjects_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_student_subjects_class
        FOREIGN KEY (class_id) REFERENCES classes(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_student_subjects_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
