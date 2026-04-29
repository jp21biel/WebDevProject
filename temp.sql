CREATE TABLE calorie_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    time_stamp TIMESTAMPTZ NOT NULL,
    calories_burnt FLOAT NOT NULL,
    origin_id VARCHAR(255) UNIQUE -- Prevents duplicate entries on re-sync
);