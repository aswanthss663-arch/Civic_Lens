# CivicTrack AI

> **Tagline:** *"Report the Problem. Track the Action. Verify the Solution."*  
> *"Complaint poda mattum illa — resolution varaikkum track pannura system."*

CivicTrack AI is a citizen-focused public issue reporting and civic accountability platform built for hackathons and production deployment.

---

## 🛠️ Technology Stack & Constraints

This application is built **100% using native web technologies**:
- **HTML5** (Semantic structure, Geolocation API, File Drag & Drop, Canvas API)
- **CSS3** (CSS Custom Properties, Glassmorphism backdrop blurs, SVG rendering, Responsive Breakpoints)
- **Vanilla JavaScript ES Modules** (SPA Routing, LocalStorage Data Layer, Simulated AI Engine)

**Zero Third-Party Dependencies or Frameworks**:
- ❌ No React / Vue / Angular / Next.js
- ❌ No Tailwind CSS / Bootstrap
- ❌ No Firebase / MongoDB
- ❌ No external chart/map libraries required

---

## 📁 Project Structure

```
civictrack/
│
├── index.html              # Main Single-Page Application (SPA) entry shell
│
├── css/
│   ├── style.css           # Design system variables, dark/light themes, typography & global UI components
│   ├── dashboard.css       # Dashboard metrics cards, quick actions & activity feed layout
│   ├── forms.css           # Issue reporting form, dropzone & AI scanning visual overlays
│   ├── map.css             # Interactive visual Civic Map styling & pin popups
│   └── responsive.css      # Responsive rules & mobile bottom navigation bar
│
├── js/
│   ├── app.js              # Central SPA router, state manager, theme & Tamil language controller
│   ├── storage.js          # LocalStorage data persistence layer & realistic 10-complaint demo seed
│   ├── api.js              # Asynchronous REST API abstraction wrapper (ready for Python backend)
│   ├── ai.js               # Prototype AI Engine (vision analysis, severity rating, 0-100 priority score, duplicate detection)
│   ├── report.js           # Issue reporting form logic, camera/upload handling, Geolocation API
│   ├── complaints.js       # My Complaints list view with multi-status filters (Submitted, Verified, Resolved, Reopened)
│   ├── details.js          # Interactive timeline tracking, Citizen Verification prompt, SLA escalation alerts
│   ├── map.js              # Interactive visual SVG Civic Map renderer with zone labels & popups
│   ├── dashboard.js        # Overview metrics & activity feed rendering
│   ├── public-dashboard.js # Public transparency analytics & pure SVG charts generator
│   ├── insights.js         # AI Macro Insights briefing (hotspot areas, recurring issue alerts)
│   ├── notifications.js    # Real-time notifications drawer & badge counter
│   └── profile.js          # User profile settings & hackathon demo data reset tools
│
└── README.md               # Complete Hackathon Demo Guide & Backend Integration Architecture
```

---

## 🚀 How to Run the Project

Since CivicTrack AI uses pure standard Web Standards and ES Modules:

### Option 1: Static File Server (Recommended)
You can serve the directory using any simple static HTTP server:
```bash
# Using Python 3 built-in HTTP server:
python3 -m http.server 8000
```
Then open your browser at:
`http://localhost:8000`

### Option 2: Directly Open `index.html` in Web Browser
Open `index.html` directly in modern web browsers (Chrome, Firefox, Edge, Safari). Note that ES module imports require serving over `http://` or `file://` with local module support enabled.

---

## 🎯 13-Step Hackathon Demo Presentation Flow

Follow this exact flow during your hackathon presentation to showcase all core features:

1. **Step 1: Open CivicTrack AI**  
   - Show the modern dark-themed dashboard header with tagline *"Your city. Your voice. Your impact."* and overall stats (Total 1,284, Resolved 947, 73.7% Resolution Rate).

2. **Step 2: Click "+ Report a Problem"**  
   - Click the primary CTA button on the sidebar or top hero.

3. **Step 3: Upload / Snap Image**  
   - Click the image dropzone or `📷 Use Camera` button to select/generate an issue photo.

4. **Step 4: AI Prototype Analysis Runs**  
   - Observe the live scanning animation output:
     - **Pothole detected**
     - **Confidence: 94%**
     - **Severity: HIGH**
     - **AI Priority Score: 87/100**

5. **Step 5: GPS Location Capture**  
   - Click `🎯 Use My Location (GPS)` to request browser geolocation API permission. Coordinates (Lat 13.0850, Lng 80.2101) fill automatically.

6. **Step 6: Smart AI Summary & Dept Routing**  
   - AI generates a recommended department: *"Road Maintenance & Engineering"* and impact summary.

7. **Step 7: Duplicate Complaint Detection**  
   - Notice the duplicate warning pill if another report is within 500m.

8. **Step 8: Click "Submit Complaint"**  
   - System generates a unique Complaint ID: e.g. `CT-2026-001284`.

9. **Step 9: Interactive Timeline Tracking**  
   - View live tracking timeline: `Submitted` → `AI Verified` → `Assigned` → `In Progress` → `Resolved` → `Citizen Verification`.

10. **Step 10: Simulate Authority Action**  
    - Click the demo button `[ Simulate: Authority Resolve ]` to simulate authority marking the work finished.

11. **Step 11: Citizen Verification Alert Appears**  
    - Prominent prompt appears: *"Has this problem actually been fixed on the ground?"*

12. **Step 12: Click "NO, STILL EXISTS"**  
    - Status immediately transitions to **REOPENED**.
    - Notification notice sent: *"Thank you. The issue has been reopened and escalated for further action."*

13. **Step 13: Automatic Escalation SLA Warning**  
    - System displays: `⚠️ Complaint Delayed - Escalation Recommended`.

---

## 🐍 Future Python Backend & PostgreSQL Integration Guide

Although this hackathon prototype uses `localStorage` for frontend persistence, all data operations are strictly encapsulated inside `js/api.js`.

To connect to a Python (FastAPI / Flask) + PostgreSQL backend:

1. **Replace LocalStorage in `js/api.js`**:
   ```javascript
   // Example Python REST API Connection inside js/api.js
   const API_BASE_URL = 'http://localhost:8000/api/v1';

   export const API = {
     async getComplaints(filter = {}) {
       const res = await fetch(`${API_BASE_URL}/complaints?status=${filter.status || ''}`);
       return await res.json();
     },

     async createComplaint(data) {
       const res = await fetch(`${API_BASE_URL}/complaints`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(data)
       });
       return await res.json();
     },

     async updateComplaintStatus(id, newStatus, byUser, notes) {
       const res = await fetch(`${API_BASE_URL}/complaints/${id}/status`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: newStatus, byUser, notes })
       });
       return await res.json();
     }
   };
   ```

2. **Suggested Database Schema (PostgreSQL)**:
   - `users` (id, name, email, phone, role)
   - `complaints` (id VARCHAR PRIMARY KEY, category, title, description, latitude, longitude, address, zone, severity, priority_score, status, created_at, assigned_department, sla_due_date, image_url)
   - `timeline_events` (id, complaint_id, status, label, timestamp, updated_by, notes)
   - `citizen_verifications` (id, complaint_id, is_fixed, feedback_notes, verified_at)

---

## 💡 Simulated & Prototype Features Disclosure

To ensure transparency during hackathon evaluation, the following features are simulated prototype implementations:
- **AI Computer Vision**: Rule-based heuristic simulation of image detection, confidence levels, and severity ratings (`js/ai.js`).
- **Civic Map**: Interactive visual SVG grid map simulating city zones and pin locations without requiring external Google Maps / Mapbox API tokens.
- **Authority Workflow**: Simulated using the floating `[DEMO CONTROLS]` action bar allowing judges to test status changes instantaneously.
