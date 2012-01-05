CREATE TABLE feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name BLOB NOT NULL,
  url BLOB NOT NULL,
  last_mod BLOB,
  subscribers INTEGER DEFAULT 0
);

CREATE TABLE entry (
  id VARCHAR(27) UNIQUE NOT NULL,
  feed_id INTEGER NOT NULL,
  title BLOB,
  link BLOB,
  author BLOB,
  content BLOB,
  summary BLOB,
  issued DATETIME,
  modified DATETIME,
  read BOOLEAN DEFAULT 0
);
