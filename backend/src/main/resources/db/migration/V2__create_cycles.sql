-- V2: Create cycles table
CREATE TABLE cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    goal_setting_start DATE NOT NULL,
    goal_setting_end DATE NOT NULL,
    q1_start DATE,
    q1_end DATE,
    q2_start DATE,
    q2_end DATE,
    q3_start DATE,
    q3_end DATE,
    q4_start DATE,
    q4_end DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
