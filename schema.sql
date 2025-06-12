DROP TABLE IF EXISTS squares;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS games;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_initial TEXT NOT NULL,
    email TEXT NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    game_id INTEGER,
    is_admin BOOLEAN,
    FOREIGN KEY (game_id) REFERENCES games (id)
);

CREATE TABLE squares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number INTEGER NOT NULL CHECK (number >= 1 AND number <= 60),
    user_id INTEGER,
    game_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (game_id) REFERENCES games (id)
);

CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INTEGER NOT NULL,
    expectant_first_name TEXT NOT NULL,
    expectant_last_name TEXT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users (id)
);

-- Initialize all 60 squares in the grid
-- INSERT INTO squares (number, user_id, game_id) VALUES
-- (1, NULL), (2, NULL), (3, NULL), (4, NULL), (5, NULL),
-- (6, NULL), (7, NULL), (8, NULL), (9, NULL), (10, NULL),
-- (11, NULL), (12, NULL), (13, NULL), (14, NULL), (15, NULL),
-- (16, NULL), (17, NULL), (18, NULL), (19, NULL), (20, NULL),
-- (21, NULL), (22, NULL), (23, NULL), (24, NULL), (25, NULL),
-- (26, NULL), (27, NULL), (28, NULL), (29, NULL), (30, NULL),
-- (31, NULL), (32, NULL), (33, NULL), (34, NULL), (35, NULL),
-- (36, NULL), (37, NULL), (38, NULL), (39, NULL), (40, NULL),
-- (41, NULL), (42, NULL), (43, NULL), (44, NULL), (45, NULL),
-- (46, NULL), (47, NULL), (48, NULL), (49, NULL), (50, NULL),
-- (51, NULL), (52, NULL), (53, NULL), (54, NULL), (55, NULL),
-- (56, NULL), (57, NULL), (58, NULL), (59, NULL), (60, NULL);