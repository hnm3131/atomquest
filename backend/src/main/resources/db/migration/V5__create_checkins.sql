-- V5: Create check_ins table
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_sheet_id UUID NOT NULL REFERENCES goal_sheets(id),
    manager_id UUID NOT NULL REFERENCES users(id),
    employee_id UUID NOT NULL REFERENCES users(id),
    quarter VARCHAR(5) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    feedback TEXT,
    overall_rating VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(goal_sheet_id, quarter)
);

CREATE INDEX idx_checkins_manager ON check_ins(manager_id);
CREATE INDEX idx_checkins_employee ON check_ins(employee_id);
