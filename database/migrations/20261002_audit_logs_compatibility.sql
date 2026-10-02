-- Upgrade the legacy audit_logs table without removing existing audit data.
ALTER TABLE audit_logs
    ADD COLUMN module VARCHAR(100) NOT NULL DEFAULT 'LEGACY' AFTER action,
    ADD COLUMN record_id BIGINT UNSIGNED NULL AFTER module,
    ADD COLUMN old_values JSON NULL AFTER description,
    ADD COLUMN new_values JSON NULL AFTER old_values,
    ADD COLUMN user_agent VARCHAR(500) NULL AFTER ip_address;

UPDATE audit_logs
SET module = COALESCE(NULLIF(entity_type, ''), 'LEGACY'),
    record_id = entity_id,
    new_values = CASE
        WHEN description IS NULL THEN NULL
        ELSE JSON_OBJECT('description', description)
    END;