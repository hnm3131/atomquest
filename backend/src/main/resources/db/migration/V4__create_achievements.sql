-- V4: Create achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    quarter VARCHAR(5) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    actual_value DECIMAL(15, 2),
    actual_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'ON_TRACK', 'COMPLETED')),
    computed_score DECIMAL(5, 2),
    employee_comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(goal_id, quarter)
);

CREATE INDEX idx_achievements_goal ON achievements(goal_id);
CREATE INDEX idx_achievements_quarter ON achievements(quarter);
