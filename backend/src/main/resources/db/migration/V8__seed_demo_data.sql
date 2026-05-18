-- V8: Seed demo data
-- Password for all: respective role name + @123 (bcrypt hashed)
-- employee@atomquest.com / Employee@123
-- manager@atomquest.com / Manager@123
-- admin@atomquest.com / Admin@123

-- Admin user
INSERT INTO users (id, email, password, name, role, department, designation)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@atomquest.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Priya Sharma',
    'ADMIN',
    'Human Resources',
    'HR Director'
);

-- Manager user
INSERT INTO users (id, email, password, name, role, department, designation, manager_id)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'manager@atomquest.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Rahul Verma',
    'MANAGER',
    'Engineering',
    'Engineering Manager',
    'a0000000-0000-0000-0000-000000000001'
);

-- Employee users
INSERT INTO users (id, email, password, name, role, department, designation, manager_id)
VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'employee@atomquest.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Ananya Patel',
    'EMPLOYEE',
    'Engineering',
    'Software Engineer',
    'a0000000-0000-0000-0000-000000000002'
);

INSERT INTO users (id, email, password, name, role, department, designation, manager_id)
VALUES (
    'a0000000-0000-0000-0000-000000000004',
    'employee2@atomquest.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Vikram Singh',
    'EMPLOYEE',
    'Engineering',
    'Senior Developer',
    'a0000000-0000-0000-0000-000000000002'
);

-- Active cycle (FY 2026-27)
INSERT INTO cycles (id, name, goal_setting_start, goal_setting_end,
    q1_start, q1_end, q2_start, q2_end, q3_start, q3_end, q4_start, q4_end, is_active)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'FY 2026-27',
    '2026-05-01', '2026-06-30',
    '2026-07-01', '2026-07-31',
    '2026-10-01', '2026-10-31',
    '2027-01-01', '2027-01-31',
    '2027-03-01', '2027-04-30',
    TRUE
);
