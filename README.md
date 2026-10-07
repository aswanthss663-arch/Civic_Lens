# Civic Lens

> **Tagline:** *"Report the Problem. Track the Action. Verify the Solution."*  
> *"Closing the accountability loop from citizen report to verified resolution."*

Civic Lens is a citizen-focused civic issue reporting and accountability platform that empowers residents to report infrastructure problems, track authority progress, review resolution evidence, and verify completed fixes before issues are officially closed.

---

## 🎯 Problem Statement

Traditional civic grievance systems suffer from significant transparency gaps:
- **Lack of Tracking:** Citizens submit complaints into a "black box" without clear progress status or timelines.
- **Premature Closure:** Authorities often mark complaints as "Resolved" without on-the-ground proof or citizen verification.
- **Duplicate Overload:** Municipal offices receive hundreds of duplicate complaints for the same incident (e.g., a major pothole or water leak), wasting administrative bandwidth.
- **Low Public Trust:** Absence of verifiable resolution evidence breeds public frustration and disengagement.

---

## 💡 The Civic Lens Solution

Civic Lens resolves these challenges through an end-to-end accountability workflow:

```
Citizen identifies a civic/environmental problem
        ↓
Uploads issue image & previews details
        ↓
Automatic location/geolocation capture (GPS + Address)
        ↓
AI-based issue categorization & severity rating
        ↓
Duplicate issue detection (Proximity + Text similarity)
        ↓
Issue submitted to database
        ↓
Issue status tracking & authority action updates
        ↓
Resolution evidence uploaded by authority squad
        ↓
Citizen verifies resolution (Confirm & Close OR Reject & Reopen)
        ↓
Issue closed
```

---

## ✨ Key Features

1. **Civic Issue Reporting:** Seamless single-page application workflow for reporting potholes, streetlight failures, garbage overflows, drainage blockages, and public property damage.
2. **Enhanced Image Upload:** Drag-and-drop or file picker with instant image preview, format validation (JPG, JPEG, PNG, WEBP), and size checks.
3. **Geolocation Tagging:** HTML5 Browser Geolocation API integration with automatic latitude/longitude capture and editable address landmarks.
4. **AI Issue Categorization:** Baseline machine-learning microservice that predicts issue category, confidence level, severity rating, and recommended department.
5. **Duplicate Issue Detection:** Proximity-based Haversine distance analysis and category matching to flag potential duplicate reports before submission.
6. **Status Lifecycle Tracking:** Real-time progress timeline supporting `SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `VERIFICATION_PENDING`, `VERIFIED`, `CLOSED`, and `REOPENED`.
7. **Resolution Evidence:** Mandatory proof-of-work image upload and notes from municipal field squads when marking issues as resolved.
8. **Citizen Resolution Verification:** Interactive verification prompt enabling reporting citizens to verify completed work or reject and reopen unresolved issues.
9. **Public Transparency Dashboard:** Citywide resolution rate metrics, department SLA performance, interactive Civic Map, and zonal analytics.

---

## 🏗️ System Architecture

Civic Lens follows a modular multi-tier microservice architecture:

```
+-------------------------------------------------------------+
|               Frontend (Browser SPA)                        |
|   HTML5, CSS3 Glassmorphism, Vanilla JS ES Modules, Leaflet |
+-------------------------------------------------------------+
                              |
                              v  HTTP REST API
+-------------------------------------------------------------+
|               Node.js / Express Backend                     |
|  REST Controllers, Input Validation, CORS, DB Connection    |
+-------------------------------------------------------------+
               |                               |
               v (SQL Query)                   v (Proxy HTTP)
+-------------------------------+   +-----------------------------------+
|      PostgreSQL Database      |   |    Python FastAPI AI Service     |
| (Schema: schema.sql & seed)   |   | (Predict, Duplicate Check, Health)|
+-------------------------------+   +-----------------------------------+
```

---

## 🛠️ Technology Stack

### Frontend
- **Core:** HTML5, Vanilla JavaScript ES Modules (SPA Router, State Management).
- **Styling:** Custom CSS3 Design System with HSL Color Tokens, Dark/Light Mode Glassmorphism, Responsive Breakpoints.
- **Mapping:** Leaflet.js (OpenStreetMap engine with native pin rendering).
- **APIs:** HTML5 Geolocation API, File Drag & Drop API, Canvas API.

### Backend API
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Middleware:** CORS, dotenv, JSON Body Parser.
- **Data Abstraction:** PostgreSQL client (`pg`) with automatic SQLite fallback (`civictrack.db`) for seamless standalone evaluation.

### Database
- **Engine:** PostgreSQL 14+ (or SQLite fallback)
- **Files:** `database/schema.sql`, `database/seed.sql`

### AI Service Microservice
- **Language:** Python 3.10+
- **Framework:** FastAPI / Uvicorn
- **Modules:** Pydantic schemas, Pillow image processing, Haversine distance calculator, Jaccard text similarity engine.

---

## 🤖 AI Integration Strategy

The AI microservice (`ai-service/`) is structured with a modular architecture so deep-learning computer vision models (e.g., YOLOv8, ResNet, OpenCV) or cloud vision APIs (e.g., Google Cloud Vision, OpenAI Vision API) can be hooked in without altering API contracts.

### 1. Automatic Issue Categorization
- **Current Prototype:** Heuristic keyword & visual feature classifier evaluating uploaded image metadata, selected category, and issue title/description.
- **Output:**
  ```json
  {
    "category": "Garbage / Waste",
    "confidence": 0.96,
    "severity": "HIGH",
    "recommendation": "Deploy heavy compactor truck unit immediately and sanitize area.",
    "priority_score": 88
  }
  ```
- **Future Production Plan:** Train a custom YOLOv8 / PyTorch model on annotated urban civic datasets (potholes, garbage piles, broken lights, fallen trees).

### 2. Duplicate Issue Detection
- **Algorithm:** Combines Haversine geographic distance calculation ($D \le 500\text{m}$), category match weight, and text similarity scoring.
- **Thresholds:** `DUPLICATE_DISTANCE_METERS=500`, `DUPLICATE_THRESHOLD=0.75`.
- **User Experience:** Shows a warning banner `"Potential duplicate detected"` with the matching issue ID and distance, allowing the citizen to link their report or proceed.

---

## 🗄️ Database Schema

The database schema (`database/schema.sql`) includes the following core tables:

1. **`users`**: User accounts (Citizen, Municipal Officer, Admin) with email, hashed passwords, roles, and contact details.
2. **`issues`**: Central issue reports containing title, description, category, severity, priority score, lat/lng coordinates, address, status, AI confidence, and department assignment.
3. **`issue_images`**: Multi-image storage linking photos (Initial, Evidence, Verification) to issues.
4. **`issue_status_history`**: Audit trail tracking status state changes, timestamps, and notes.
5. **`issue_evidence`**: Proof of work uploaded by municipal authorities upon marking an issue resolved.
6. **`issue_verification`**: Citizen confirmation or rejection feedback log.
7. **`ai_predictions`**: Log of raw AI microservice predictions, confidence scores, and recommendations.

---

## ⚙️ Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: Optional (system automatically falls back to embedded SQLite if PostgreSQL is not running)

### 1. Clone the Repository
```bash
git clone https://github.com/aswanthss663-arch/Civic_Lens.git
cd Civic_Lens
```

### 2. Install Node Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Install Python AI Service Dependencies
```bash
cd ai-service
pip install -r requirements.txt
cd ..
```

---

## 🔐 Environment Variables

Copy `.env.example` to create your local `.env` configuration:

```bash
cp .env.example .env
```

Default `.env` settings:
```env
PORT=5001
NODE_ENV=development
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=civic_lens
AI_SERVICE_URL=http://localhost:8000
DUPLICATE_DISTANCE_METERS=500
DUPLICATE_THRESHOLD=0.80
```

---

## 🗃️ Database Setup

### Option A: PostgreSQL Setup (Recommended for Production)
```bash
# Create database
createdb civic_lens

# Execute schema and seed scripts
psql -d civic_lens -f database/schema.sql
psql -d civic_lens -f database/seed.sql
```

### Option B: Automatic SQLite Fallback (Zero Config)
If PostgreSQL is not running, the Node.js Express backend will automatically connect to `civictrack.db` with sample data. No manual database setup is required.

---

## 🚀 Running the Application

### 1. Start the Python FastAPI AI Service (Terminal 1)
```bash
cd ai-service
uvicorn main:app --reload --port 8000
```
*API docs available at: `http://localhost:8000/docs`*

### 2. Start the Node.js Express Backend & Frontend (Terminal 2)
```bash
node backend/server.js
```
*App & REST API active at: `http://localhost:5001`*

Open your browser at **`http://localhost:5001`** to interact with Civic Lens!

---

## 📡 API Documentation

### Issues Endpoints
- `GET /api/issues`: List all issues (supports `status`, `category`, `search` query parameters).
- `POST /api/issues`: Create a new issue report.
- `GET /api/issues/:id`: Retrieve single issue details with timeline.
- `PATCH /api/issues/:id/status`: Update status (e.g., `IN_PROGRESS`, `RESOLVED`).
- `POST /api/issues/:id/evidence`: Upload resolution evidence image and notes.
- `POST /api/issues/:id/verify`: Citizen resolution verification (`isFixed: true/false`).

### AI Microservice Endpoints
- `POST /api/ai/classify` -> Proxies to FastAPI `POST /predict`.
- `POST /api/ai/duplicate-check` -> Proxies to FastAPI `POST /duplicate-check`.
- `GET /api/ai/health` -> AI microservice status.

### Authentication Endpoints
- `POST /api/auth/signup`: Register new citizen or officer account.
- `POST /api/auth/signin`: Authenticate user and issue session token.
- `GET /api/auth/me`: Retrieve current profile.

---

## 📁 Project Structure

```
Civic_Lens/
│
├── index.html              # Main Single-Page Application (SPA) entry shell
│
├── css/                    # Custom Vanilla CSS Design System
│   ├── style.css           # Core theme variables, glassmorphism, typography & global UI
│   ├── dashboard.css       # Metrics grid & activity feed styling
│   ├── forms.css           # Dropzone, AI scan preview & form inputs
│   ├── map.css             # Interactive Leaflet map styling & popups
│   └── responsive.css      # Mobile navigation breakpoints
│
├── js/                     # ES Modules Frontend Application Logic
│   ├── app.js              # SPA Router, state manager & theme controller
│   ├── api.js              # REST API Service Wrapper (Node backend integration)
│   ├── ai.js               # Frontend AI helper & priority score calculation
│   ├── report.js           # Issue reporting form, dropzone & geolocation handling
│   ├── complaints.js       # My Complaints tracking list & status filters
│   ├── details.js          # Timeline tracking & Citizen Verification UI
│   ├── dashboard.js        # Overview metrics & live location widget
│   ├── map.js              # Leaflet map pin generator
│   └── storage.js          # LocalStorage data persistence layer
│
├── backend/                # Node.js Express REST API Backend
│   ├── server.js           # Main Express server entry point
│   ├── package.json        # Backend dependencies
│   ├── config/             # Database connection (PostgreSQL + SQLite fallback)
│   ├── controllers/        # Business logic controllers
│   ├── routes/             # Express API routes (issues, ai, auth, stats)
│   └── services/           # AI proxy service
│
├── ai-service/             # Python FastAPI AI Microservice
│   ├── main.py             # FastAPI entry point
│   ├── requirements.txt    # Python dependencies
│   ├── models/             # Pydantic schema models
│   ├── routes/             # FastAPI routers (predict, duplicate, health)
│   └── services/           # Classification & Haversine duplicate detector algorithms
│
├── database/               # PostgreSQL Database Scripts
│   ├── schema.sql          # DDL tables, indexes, constraints
│   └── seed.sql            # Seed complaints, users, timeline events
│
├── tests/                  # Automated API Test Suite
│   └── api.test.js         # Node test runner suite
│
├── .env.example            # Environment variables template
├── package.json            # Root scripts runner
└── README.md               # Project documentation
```

---

## 🧪 Testing

Run the automated test suite to verify backend REST APIs, AI classification proxy, and duplicate detection:

```bash
npm test
```

Expected output:
```
✔ 1. AI Classification Service Baseline
✔ 2. Duplicate Issue Detection Algorithm
✔ 3. Issue Controller Response Format
✔ Civic Lens API Tests - Pass 4 / Fail 0
```

---

## 🔮 Future Enhancements

1. **Deep Learning Computer Vision:** Integrate PyTorch / YOLOv8 models into `ai-service/services/classifier.py` for automated multi-class damage detection.
2. **Authority Portal:** Dedicated municipal officer dispatch board with SLA escalation countdown timers.
3. **GIS Heatmap Analytics:** Mapbox / GIS spatial density maps for urban planning and municipal resource allocation.
4. **Push Notifications:** Web Push / SMS alerts notifying citizens when authorities update issue status or request verification.
