CREATE TABLE feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name BLOB NOT NULL,
  url BLOB NOT NULL,
  last_mod BLOB,
);

CREATE TABLE entry (
  id TEXT UNIQUE NOT NULL,
  feed_id INTEGER NOT NULL,
  title BLOB,
  link BLOB,
  author BLOB,
  content BLOB,
  summary BLOB,
  issued INTEGER,
  modified INTEGER,
  read BOOLEAN DEFAULT 0,
  saved BOOLEAN DEFAULT 0
);
