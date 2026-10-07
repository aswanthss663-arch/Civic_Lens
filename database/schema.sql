-- ==========================================================================
-- Civic Lens - PostgreSQL Database Schema
-- Database: civic_lens (or civictrack)
-- ==========================================================================

-- 1. Users Table
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

-- 2. Issues / Complaints Table
CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(50) PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'HIGH',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address VARCHAR(255) NOT NULL,
    image_url TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED',
    ai_category VARCHAR(100),
    ai_confidence DOUBLE PRECISION DEFAULT 0.90,
    duplicate_of VARCHAR(50) REFERENCES issues(id) ON DELETE SET NULL,
    assigned_department VARCHAR(100) DEFAULT 'Road Maintenance & Engineering',
    priority_score INT DEFAULT 75,
    zone VARCHAR(100) DEFAULT 'Central Zone',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Issue Images Table
CREATE TABLE IF NOT EXISTS issue_images (
    id SERIAL PRIMARY KEY,
    issue_id VARCHAR(50) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(50) DEFAULT 'EVIDENCE', -- 'INITIAL', 'RESOLUTION', 'VERIFICATION'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Issue Status History / Timeline Table
CREATE TABLE IF NOT EXISTS issue_status_history (
    id SERIAL PRIMARY KEY,
    issue_id VARCHAR(50) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    updated_by VARCHAR(100) DEFAULT 'System',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Issue Resolution Evidence Table
CREATE TABLE IF NOT EXISTS issue_evidence (
    id SERIAL PRIMARY KEY,
    issue_id VARCHAR(50) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    image_url TEXT,
    description TEXT NOT NULL,
    uploaded_by VARCHAR(100) DEFAULT 'Municipal Officer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Issue Citizen Verification Table
CREATE TABLE IF NOT EXISTS issue_verification (
    id SERIAL PRIMARY KEY,
    issue_id VARCHAR(50) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    is_fixed BOOLEAN NOT NULL,
    notes TEXT,
    verification_image_url TEXT,
    verified_by VARCHAR(100) DEFAULT 'Citizen',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. AI Predictions Table
CREATE TABLE IF NOT EXISTS ai_predictions (
    id SERIAL PRIMARY KEY,
    issue_id VARCHAR(50) REFERENCES issues(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    severity VARCHAR(20) NOT NULL,
    recommendation TEXT,
    raw_output JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================================
-- INDEXES FOR FAST QUERYING
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_status_history_issue_id ON issue_status_history(issue_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
