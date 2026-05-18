-- V3: Create goal_sheets and goals tables
CREATE TABLE goal_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES users(id),
    cycle_id UUID NOT NULL REFERENCES cycles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED')),
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    rejection_comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(employee_id, cycle_id)
);

CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_sheet_id UUID NOT NULL REFERENCES goal_sheets(id) ON DELETE CASCADE,
    thrust_area VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    uom_type VARCHAR(20) NOT NULL CHECK (uom_type IN ('NUMERIC_MIN', 'NUMERIC_MAX', 'PERCENTAGE', 'TIMELINE', 'ZERO_BASED')),
    target_value DECIMAL(15, 2),
    target_date DATE,
    weightage INTEGER NOT NULL CHECK (weightage >= 10),
    is_shared BOOLEAN DEFAULT FALSE,
    shared_source_id UUID REFERENCES goals(id),
    shared_owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_goal_sheets_employee ON goal_sheets(employee_id);
CREATE INDEX idx_goal_sheets_cycle ON goal_sheets(cycle_id);
CREATE INDEX idx_goal_sheets_status ON goal_sheets(status);
CREATE INDEX idx_goals_sheet ON goals(goal_sheet_id);
CREATE INDEX idx_goals_shared_source ON goals(shared_source_id);
