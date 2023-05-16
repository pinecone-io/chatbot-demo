CREATE TYPE speaker AS ENUM ('user', 'ai');

CREATE TABLE conversations (
  user_id STRING,
  entry STRING,
  speaker speaker,
  created_at TIMESTAMP PRIMARY KEY NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- DROP TABLE memories;