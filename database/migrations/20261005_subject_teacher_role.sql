ALTER TABLE users
    MODIFY COLUMN role ENUM(
        'ADMIN',
        'ACADEMIC_MASTER',
        'SUBJECT_TEACHER',
        'TEACHER'
    ) NOT NULL;

UPDATE users u
INNER JOIN teachers t ON t.user_id = u.id
SET u.role = 'SUBJECT_TEACHER'
WHERE u.role IN ('', 'TEACHER');
