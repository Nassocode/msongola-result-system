-- ============================================================
-- FORM THREE AND FOUR SUBJECTS SETUP
-- Correct subject list for Forms 3 and 4:
-- History, Geography, Islamic Studies, Kiswahili, English,
-- Civics, Physics, Chemistry, Biology, Basic Mathematics,
-- Literature in English
-- ============================================================

INSERT INTO subjects (subject_code, subject_name, status)
VALUES
    ('CIV', 'Civics', 'ACTIVE'),
    ('BMA', 'Basic Mathematics', 'ACTIVE'),
    ('LIE', 'Literature in English', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    subject_name = VALUES(subject_name),
    status = VALUES(status);

-- Remove any stale subject mappings that do not belong to Forms 3 and 4.
DELETE fs
FROM form_subjects fs
INNER JOIN forms f ON f.id = fs.form_id
LEFT JOIN subjects s ON s.id = fs.subject_id
WHERE f.form_number IN (3, 4)
  AND (
      s.subject_code IS NULL
      OR s.subject_code NOT IN (
          'HIS', 'GEO', 'EDK', 'KIS', 'ENG', 'CIV', 'PHY',
          'CHE', 'BIO', 'BMA', 'LIE'
      )
  );

INSERT INTO form_subjects (form_id, subject_id, is_compulsory, subject_order)
SELECT
    f.id,
    s.id,
    TRUE,
    FIELD(
        s.subject_code,
        'HIS', 'GEO', 'EDK', 'KIS', 'ENG', 'CIV', 'PHY',
        'CHE', 'BIO', 'BMA', 'LIE'
    )
FROM forms f
CROSS JOIN subjects s
WHERE f.form_number IN (3, 4)
  AND s.subject_code IN (
      'HIS', 'GEO', 'EDK', 'KIS', 'ENG', 'CIV', 'PHY',
      'CHE', 'BIO', 'BMA', 'LIE'
  )
ON DUPLICATE KEY UPDATE
    is_compulsory = VALUES(is_compulsory),
    subject_order = VALUES(subject_order),
    status = 'ACTIVE';
