-- ==========================================================================
-- CivicTrack AI - PostgreSQL Database DDL Schema Script
-- Database: civictrack
-- ==========================================================================

-- 1. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    head_officer VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    active_complaints_count INT DEFAULT 0,
    resolution_rate FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    category_icon VARCHAR(10) DEFAULT '📋',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Location Fields
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    zone VARCHAR(100) DEFAULT 'Central Zone',

    -- Severity & Priority
    severity VARCHAR(20) DEFAULT 'HIGH',
    priority_score INT DEFAULT 70,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_department VARCHAR(100) DEFAULT 'Road Maintenance & Engineering',
    sla_days INT DEFAULT 3,
    sla_due_date TIMESTAMP,
    image TEXT,

    -- AI Prototype Output
    ai_detection VARCHAR(100),
    ai_confidence INT DEFAULT 90,
    ai_severity VARCHAR(20) DEFAULT 'HIGH',
    ai_recommendation TEXT,

    -- Citizen Verification Fields
    citizen_verification_prompt_active BOOLEAN DEFAULT FALSE,
    citizen_verification_status VARCHAR(50) DEFAULT 'PENDING',
    citizen_verification_notes TEXT
);

-- 3. Create Timeline Events Table
CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    time VARCHAR(100) NOT NULL,
    icon VARCHAR(10) DEFAULT '✓',
    updated_by VARCHAR(100) DEFAULT 'System',
    notes TEXT
);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notif_type VARCHAR(50) DEFAULT 'STATUS',
    complaint_id VARCHAR(50),
    time VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(10) DEFAULT 'dark',
    gps_permission VARCHAR(20) DEFAULT 'prompt',
    user_name VARCHAR(100) DEFAULT 'Karthik Raja',
    user_email VARCHAR(100) DEFAULT 'karthik.citizen@civictrack.ai',
    user_phone VARCHAR(20) DEFAULT '+91 98765 43210'
);

-- 6. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(30) DEFAULT 'Citizen',
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================================
-- CREATE INDEXES FOR FAST QUERY PERFORMANCE
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_zone ON complaints(zone);
CREATE INDEX IF NOT EXISTS idx_timeline_complaint_id ON timeline_events(complaint_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================================================
-- SEED INITIAL DEPARTMENT DATA
-- ==========================================================================
INSERT INTO departments (name, head_officer, contact_email, contact_phone, resolution_rate)
VALUES 
  ('Road Maintenance & Engineering', 'Er. Sundaram P.', 'roads@civictrack.ai', '+91 44 2888 1001', 82.5),
  ('Electrical Infrastructure', 'Er. Meenakshi S.', 'electrical@civictrack.ai', '+91 44 2888 1002', 78.0),
  ('Solid Waste Management', 'Officer Rajesh Kumar', 'sanitation@civictrack.ai', '+91 44 2888 1003', 91.2),
  ('Metro Water & Sewage Board', 'Er. Anbarasan V.', 'sewage@civictrack.ai', '+91 44 2888 1004', 65.4),
  ('Traffic Police & Signals Division', 'Insp. Vikram R.', 'traffic@civictrack.ai', '+91 44 2888 1005', 88.0),
  ('Parks & Urban Forestry', 'Officer Deepa M.', 'forestry@civictrack.ai', '+91 44 2888 1006', 74.8)
ON CONFLICT (name) DO NOTHING;

-- Seed Default Users
INSERT INTO users (full_name, email, hashed_password, phone, role, avatar)
VALUES
  ('Karthik Raja', 'karthik.citizen@civictrack.ai', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '+91 98765 43210', 'Citizen', 'KR'),
  ('Er. Sundaram P.', 'officer.sundaram@civictrack.ai', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '+91 44 2888 1001', 'Municipal Officer', 'SP')
ON CONFLICT (email) DO NOTHING;

