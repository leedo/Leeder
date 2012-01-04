CREATE TABLE feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(64) NOT NULL,
  url VARCHAR(256) NOT NULL,
  alias_of INTEGER NULL,
  last_mod VARCHAR(64),
  subscribers INTEGER DEFAULT 0
);

CREATE TABLE entry (
  id VARCHAR(27) UNIQUE NOT NULL,
  feed_id INTEGER NOT NULL,
  title VARCHAR(64),
  link VARCHAR(256),
  author VARCHAR(64),
  content TEXT,
  summary TEXT,
  issued DATETIME,
  modified DATETIME,
  read BOOLEAN DEFAULT 0
);
