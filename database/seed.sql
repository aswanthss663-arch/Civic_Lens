-- ==========================================================================
-- Civic Lens - Seed Data Script
-- Populate database with sample users, issues, status history, and evidence
-- ==========================================================================

-- Seed Users
INSERT INTO users (id, full_name, email, hashed_password, phone, role, avatar)
VALUES
  (1, 'Karthik Raja', 'karthik.citizen@civiclens.ai', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '+91 98765 43210', 'Citizen', 'KR'),
  (2, 'Er. Sundaram P.', 'officer.sundaram@civiclens.ai', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '+91 44 2888 1001', 'Municipal Officer', 'SP')
ON CONFLICT (id) DO NOTHING;

-- Seed Issues
INSERT INTO issues (
    id, user_id, title, description, category, severity, latitude, longitude, address, 
    image_url, status, ai_category, ai_confidence, assigned_department, priority_score, zone
)
VALUES
  (
    'CL-2026-00101', 1, 'Deep Dangerous Pothole near Anna Nagar Junction', 
    'A 4-foot wide pothole near Anna Nagar 2nd Avenue causing severe traffic slowdown and hazard to two-wheelers.',
    'Road Damage', 'HIGH', 13.0850, 80.2101, 'Anna Nagar 2nd Avenue, Near Anna Arch, Chennai',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    'IN_PROGRESS', 'Pothole / Road Damage', 0.94, 'Road Maintenance & Engineering', 88, 'Zone 8 - Anna Nagar'
  ),
  (
    'CL-2026-00102', 1, 'Overflowing Garbage Bin on Commercial Street', 
    'Trash dumping overflowing onto main walkway for past 3 days emitting strong odor.',
    'Garbage / Waste', 'HIGH', 13.0827, 80.2707, 'Parrys Corner, NSC Bose Road, Chennai',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80',
    'RESOLVED', 'Garbage / Solid Waste', 0.96, 'Solid Waste Management', 82, 'Zone 5 - Royapuram'
  ),
  (
    'CL-2026-00103', 1, 'Broken High-Tension Streetlight Pole', 
    'Streetlight fixture hanging precariously after heavy winds, total dark spot at night.',
    'Streetlight Problem', 'CRITICAL', 13.0604, 80.2496, 'Nungambakkam High Road, Opposite Park Hotel, Chennai',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
    'ASSIGNED', 'Streetlight / Electrical Failure', 0.91, 'Electrical Infrastructure Division', 92, 'Zone 9 - T. Nagar'
  ),
  (
    'CL-2026-00104', 1, 'Blocked Stormwater Drain Monsoon Flooding', 
    'Drainage silt clogging stormwater inlet causing 1-foot standing water level.',
    'Drainage Problem', 'CRITICAL', 13.0418, 80.2341, 'Usman Road, Near T. Nagar Bus Terminus, Chennai',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    'VERIFICATION_PENDING', 'Blocked Stormwater Drain', 0.97, 'Metro Water & Sewage Board', 95, 'Zone 10 - Kodambakkam'
  ),
  (
    'CL-2026-00105', 1, 'Burst Water Pipeline Supply Leakage', 
    'Potable water pipeline leak wasting clean water continuously on roadside.',
    'Water Leakage', 'HIGH', 13.0312, 80.2520, 'Mylapore High Road, Near Kapaleeshwarar Temple, Chennai',
    'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
    'VERIFIED', 'Water Pipeline Leakage', 0.93, 'Metro Water & Sewage Board', 79, 'Zone 13 - Adyar'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Status History
INSERT INTO issue_status_history (issue_id, status, label, updated_by, notes)
VALUES
  ('CL-2026-00101', 'SUBMITTED', 'Issue Submitted by Citizen', 'Karthik Raja', 'Report registered in system'),
  ('CL-2026-00101', 'AI_VERIFIED', 'AI Issue Classification Complete', 'Civic Lens AI Service', 'Category: Road Damage, Confidence: 94%'),
  ('CL-2026-00101', 'ASSIGNED', 'Assigned to Road Engineering Squad', 'System Dispatcher', 'Dispatched to Zone 8 field squad'),
  ('CL-2026-00101', 'IN_PROGRESS', 'Asphalt Repairs In Progress', 'Er. Sundaram P.', 'Cold-mix compaction crew deployed'),

  ('CL-2026-00102', 'SUBMITTED', 'Issue Submitted by Citizen', 'Karthik Raja', 'Garbage overflow reported'),
  ('CL-2026-00102', 'RESOLVED', 'Compactor Truck Clearance Completed', 'Sanitation Inspector', 'Area cleared and disinfected'),

  ('CL-2026-00104', 'SUBMITTED', 'Issue Submitted by Citizen', 'Karthik Raja', 'Drainage blockage reported'),
  ('CL-2026-00104', 'RESOLVED', 'High-pressure Jetting Clearing Done', 'Metro Water Team', 'Drain desilted. Pending citizen verification.')
ON CONFLICT DO NOTHING;

-- Seed Resolution Evidence
INSERT INTO issue_evidence (issue_id, image_url, description, uploaded_by)
VALUES
  ('CL-2026-00102', 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80', 'Compactor truck cleared bin and area sanitized with lime powder.', 'Officer Rajesh Kumar'),
  ('CL-2026-00104', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80', 'Jetting machine cleared silt block. Water flow restored.', 'Er. Anbarasan V.')
ON CONFLICT DO NOTHING;

-- Seed AI Predictions
INSERT INTO ai_predictions (issue_id, category, confidence, severity, recommendation)
VALUES
  ('CL-2026-00101', 'Road Damage', 0.94, 'HIGH', 'Cold-mix asphalt patch required. Inspect sub-base for water seepage.'),
  ('CL-2026-00102', 'Garbage / Waste', 0.96, 'HIGH', 'Deploy heavy compactor truck unit immediately and sanitize area.'),
  ('CL-2026-00103', 'Streetlight Problem', 0.91, 'CRITICAL', 'Replace LED driver module and inspect overhead wiring relay.'),
  ('CL-2026-00104', 'Drainage Problem', 0.97, 'CRITICAL', 'Dispatch suction tanker & high-pressure water jetting machine.')
ON CONFLICT DO NOTHING;
