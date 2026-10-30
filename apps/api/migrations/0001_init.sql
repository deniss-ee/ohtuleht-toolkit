-- Briefs (banner requests) and clients. The whole record is kept as JSON in `data`; the other columns are for listing and sorting.
CREATE TABLE briefs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'new',
  deadline TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
