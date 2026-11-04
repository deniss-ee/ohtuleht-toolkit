-- Private values of the new-employee guide (names, phone numbers, passwords, Wi-Fi, amounts). The public site only has [[key]] placeholders.
-- The API serves and accepts these only when AUTH_MODE is not "open" (that is, after Microsoft login exists).
CREATE TABLE guide_values (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
