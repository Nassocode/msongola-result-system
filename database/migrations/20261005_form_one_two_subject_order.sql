ALTER TABLE form_subjects
    ADD COLUMN subject_order SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER is_compulsory;

INSERT INTO subjects (subject_code, subject_name, status)
VALUES
    ('HIS', 'History', 'ACTIVE'),
    ('GEO', 'Geography', 'ACTIVE'),
    ('EDK', 'Elimu ya Dini ya Kiislamu', 'ACTIVE'),
    ('KIS', 'Kiswahili', 'ACTIVE'),
    ('ENG', 'English', 'ACTIVE'),
    ('PHY', 'Physics', 'ACTIVE'),
    ('CHE', 'Chemistry', 'ACTIVE'),
    ('BIO', 'Biology', 'ACTIVE'),
    ('BUS', 'Business Studies', 'ACTIVE'),
    ('HTM', 'Historia ya Tanzania na Maadili (H.T.M)', 'ACTIVE'),
    ('MAT', 'Mathematics', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    subject_name = VALUES(subject_name),
    status = VALUES(status);

DELETE fs
FROM form_subjects fs
INNER JOIN forms f ON f.id = fs.form_id
LEFT JOIN subjects s ON s.id = fs.subject_id
WHERE f.form_number IN (1, 2)
  AND (
      s.subject_code IS NULL
      OR s.subject_code NOT IN (
          'HIS', 'GEO', 'EDK', 'KIS', 'ENG', 'PHY',
          'CHE', 'BIO', 'BUS', 'HTM', 'MAT'
      )
  );

INSERT INTO form_subjects (form_id, subject_id, is_compulsory, subject_order)
SELECT
    f.id,
    s.id,
    TRUE,
    FIELD(
        s.subject_code,
        'HIS', 'GEO', 'EDK', 'KIS', 'ENG', 'PHY',
        'CHE', 'BIO', 'BUS', 'HTM', 'MAT'
    )
FROM forms f
CROSS JOIN subjects s
WHERE f.form_number IN (1, 2)
  AND s.subject_code IN (
      'HIS', 'GEO', 'EDK', 'KIS', 'ENG', 'PHY',
      'CHE', 'BIO', 'BUS', 'HTM', 'MAT'
  )
ON DUPLICATE KEY UPDATE
    is_compulsory = VALUES(is_compulsory),
    subject_order = VALUES(subject_order),
    status = 'ACTIVE';
