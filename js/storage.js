/* ==========================================================================
   CivicTrack AI - Data Storage Layer (LocalStorage Abstraction)
   ========================================================================== */

const STORAGE_KEY_COMPLAINTS = 'civictrack_complaints_v1';
const STORAGE_KEY_NOTIFICATIONS = 'civictrack_notifications_v1';
const STORAGE_KEY_SETTINGS = 'civictrack_settings_v1';
const STORAGE_KEY_USER = 'civictrack_user_v1';
const STORAGE_KEY_TOKEN = 'civictrack_token_v1';


// Initial Seed Demo Data (10 Realistic City Complaints)
const INITIAL_DEMO_COMPLAINTS = [
  {
    id: "CT-2026-001284",
    category: "Pothole",
    categoryIcon: "🕳️",
    title: "Large deep pothole at Anna Nagar 2nd Avenue",
    description: "Dangerous 8-inch deep pothole near main junction causing severe traffic slowdown and rim damage to vehicles.",
    location: {
      address: "2nd Avenue, Near Anna Arch, Anna Nagar, Chennai",
      latitude: 13.0850,
      longitude: 80.2101,
      zone: "Zone 8 - Anna Nagar"
    },
    severity: "HIGH",
    priorityScore: 87,
    status: "IN_PROGRESS", // SUBMITTED, AI_VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, CITIZEN_VERIFIED, REOPENED
    createdAt: "2026-08-29T10:30:00.000Z",
    assignedDepartment: "Road Maintenance & Engineering",
    slaDays: 3,
    slaDueDate: "2026-09-01T10:30:00.000Z",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Pothole detected",
      confidence: 94,
      severity: "HIGH",
      recommendation: "Immediate cold-mix asphalt patch required. Inspect sub-base for water seepage."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-29 10:30 AM", icon: "📝", by: "Citizen (Karthik R.)" },
      { status: "AI_VERIFIED", label: "AI Prototype Verified", time: "2026-08-29 10:31 AM", icon: "✨", by: "CivicTrack AI Engine" },
      { status: "ASSIGNED", label: "Assigned to Road Maintenance", time: "2026-08-29 11:00 AM", icon: "👷", by: "Zonal Officer" },
      { status: "IN_PROGRESS", label: "Repair Work In Progress", time: "2026-08-29 02:00 PM", icon: "🚜", by: "Contractor Crew #4" }
    ],
    citizenVerification: {
      promptActive: false,
      status: "PENDING", // PENDING, CONFIRMED, REJECTED
      notes: ""
    }
  },
  {
    id: "CT-2026-001285",
    category: "Streetlight",
    categoryIcon: "💡",
    title: "Broken LED streetlight near Central Station Metro",
    description: "Streetlight #L-42 is completely dark for 3 days. Creates safety risk for pedestrians walking at night.",
    location: {
      address: "EVR Periyar Salai, Opposite Central Railway Station",
      latitude: 13.0827,
      longitude: 80.2707,
      zone: "Zone 5 - Royapuram"
    },
    severity: "MEDIUM",
    priorityScore: 65,
    status: "RESOLVED",
    createdAt: "2026-08-27T18:15:00.000Z",
    assignedDepartment: "Electrical Infrastructure",
    slaDays: 5,
    slaDueDate: "2026-09-01T18:15:00.000Z",
    image: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Broken Luminaire / Power Failure",
      confidence: 89,
      severity: "MEDIUM",
      recommendation: "Replace driver module and 120W LED fixture on pole L-42."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-27 06:15 PM", icon: "📝", by: "Citizen (Priya S.)" },
      { status: "AI_VERIFIED", label: "AI Prototype Verified", time: "2026-08-27 06:16 PM", icon: "✨", by: "CivicTrack AI Engine" },
      { status: "ASSIGNED", label: "Assigned to Electrical Dept", time: "2026-08-28 09:00 AM", icon: "👷", by: "Discom Admin" },
      { status: "IN_PROGRESS", label: "Maintenance Crew Dispatched", time: "2026-08-28 11:30 AM", icon: "🔧", by: "Electrician Line 2" },
      { status: "RESOLVED", label: "Marked Fixed by Authority", time: "2026-08-28 04:45 PM", icon: "✅", by: "Electrical Dept Overseer" }
    ],
    citizenVerification: {
      promptActive: true, // Requires citizen prompt!
      status: "PENDING",
      notes: ""
    }
  },
  {
    id: "CT-2026-001286",
    category: "Garbage",
    categoryIcon: "🗑️",
    title: "Overflowing commercial garbage bins on Usman Road",
    description: "Trash dumped outside bins blocking shop entrance. Odor issue and stray animals gathering.",
    location: {
      address: "Usman Road Flyover Junction, T. Nagar",
      latitude: 13.0418,
      longitude: 80.2341,
      zone: "Zone 10 - T. Nagar"
    },
    severity: "HIGH",
    priorityScore: 91,
    status: "CITIZEN_VERIFIED",
    createdAt: "2026-08-25T07:45:00.000Z",
    assignedDepartment: "Solid Waste Management",
    slaDays: 3,
    slaDueDate: "2026-08-28T07:45:00.000Z",
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Solid Waste Overflow & Biohazard",
      confidence: 96,
      severity: "HIGH",
      recommendation: "Deploy heavy compactor truck unit #9 immediately."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-25 07:45 AM", icon: "📝", by: "Citizen (Venkatesh)" },
      { status: "AI_VERIFIED", label: "AI Prototype Verified", time: "2026-08-25 07:46 AM", icon: "✨", by: "CivicTrack AI Engine" },
      { status: "ASSIGNED", label: "Assigned to Sanitation Wing", time: "2026-08-25 08:30 AM", icon: "👷", by: "Sanitation Inspector" },
      { status: "IN_PROGRESS", label: "Compactor Unit Dispatched", time: "2026-08-25 10:00 AM", icon: "🚛", by: "Sanitation Supervisor" },
      { status: "RESOLVED", label: "Cleared & Sanitized", time: "2026-08-25 01:15 PM", icon: "✅", by: "Sanitation Inspector" },
      { status: "CITIZEN_VERIFIED", label: "Citizen Verified Solution", time: "2026-08-25 03:00 PM", icon: "🤝", by: "Citizen (Venkatesh)" }
    ],
    citizenVerification: {
      promptActive: false,
      status: "CONFIRMED",
      notes: "Area cleaned thoroughly and disinfected with bleaching powder. Verified!"
    }
  },
  {
    id: "CT-2026-001287",
    category: "Drainage",
    categoryIcon: "🌊",
    title: "Blocked storm water drain causing sewage water overflow",
    description: "Black foul water overflowing onto road after light rains near Velachery Main Road.",
    location: {
      address: "100 Feet Bypass Road, Near Railway Station, Velachery",
      latitude: 12.9756,
      longitude: 80.2206,
      zone: "Zone 13 - Velachery"
    },
    severity: "CRITICAL",
    priorityScore: 98,
    status: "REOPENED",
    createdAt: "2026-08-20T09:00:00.000Z",
    assignedDepartment: "Metro Water & Sewage Board",
    slaDays: 1,
    slaDueDate: "2026-08-21T09:00:00.000Z",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Stormwater Drain Obstruction / Sewage Leakage",
      confidence: 97,
      severity: "CRITICAL",
      recommendation: "High-pressure jetting machine & suction vehicle required."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-20 09:00 AM", icon: "📝", by: "Citizen (Anitha K.)" },
      { status: "AI_VERIFIED", label: "AI Verified Critical Issue", time: "2026-08-20 09:01 AM", icon: "✨", by: "CivicTrack AI Engine" },
      { status: "ASSIGNED", label: "Assigned to Sewage Board", time: "2026-08-20 09:30 AM", icon: "👷", by: "Zonal Engineer" },
      { status: "RESOLVED", label: "Authority Marked Resolved", time: "2026-08-21 04:00 PM", icon: "✅", by: "Board Field Officer" },
      { status: "REOPENED", label: "Citizen Verification Failed", time: "2026-08-22 09:00 AM", icon: "⚠️", by: "Citizen (Anitha K.)" }
    ],
    citizenVerification: {
      promptActive: false,
      status: "REJECTED",
      notes: "Sewage is still overflowing! The workers only cleared top debris without unblocking main pipe."
    }
  },
  {
    id: "CT-2026-001288",
    category: "Traffic Signal",
    categoryIcon: "🚦",
    title: "Traffic signal lights blinking amber at Busy Intersection",
    description: "Signal controllers malfunctioning. Traffic chaos during peak office hours.",
    location: {
      address: "LB Road Junction, Adyar, Chennai",
      latitude: 13.0012,
      longitude: 80.2565,
      zone: "Zone 12 - Adyar"
    },
    severity: "HIGH",
    priorityScore: 84,
    status: "ASSIGNED",
    createdAt: "2026-08-30T14:20:00.000Z",
    assignedDepartment: "Traffic Police & Signals Division",
    slaDays: 1,
    slaDueDate: "2026-08-31T14:20:00.000Z",
    image: "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Signal Controller Memory Fault",
      confidence: 91,
      severity: "HIGH",
      recommendation: "Reset PLC unit and replace phase relay timer."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-30 02:20 PM", icon: "📝", by: "Citizen (Ramesh P.)" },
      { status: "AI_VERIFIED", label: "AI Prototype Verified", time: "2026-08-30 02:21 PM", icon: "✨", by: "CivicTrack AI Engine" },
      { status: "ASSIGNED", label: "Assigned to Traffic Division", time: "2026-08-30 03:00 PM", icon: "👮", by: "Control Room Inspector" }
    ],
    citizenVerification: { promptActive: false, status: "PENDING", notes: "" }
  },
  {
    id: "CT-2026-001289",
    category: "Road Damage",
    categoryIcon: "🛣️",
    title: "Caved-in asphalt after underground cable laying work",
    description: "Trench dug for fiber cables left improperly backfilled. Road surface sinking dangerously.",
    location: {
      address: "RK Salai, Near Music Academy, Mylapore",
      latitude: 13.0473,
      longitude: 80.2608,
      zone: "Zone 9 - Mylapore"
    },
    severity: "MEDIUM",
    priorityScore: 72,
    status: "SUBMITTED",
    createdAt: "2026-08-31T09:10:00.000Z",
    assignedDepartment: "Road Maintenance & Engineering",
    slaDays: 5,
    slaDueDate: "2026-09-05T09:10:00.000Z",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Sub-base Trench Collapse",
      confidence: 88,
      severity: "MEDIUM",
      recommendation: "Compaction testing & wet mix macadam laying required."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-31 09:10 AM", icon: "📝", by: "Citizen (Deepa M.)" }
    ],
    citizenVerification: { promptActive: false, status: "PENDING", notes: "" }
  },
  {
    id: "CT-2026-001290",
    category: "Public Property Damage",
    categoryIcon: "🌳",
    title: "Uprooted tree branch leaning on electric cables",
    description: "Storm damaged large banyan branch hanging precariously above pedestrian walkway.",
    location: {
      address: "Harrington Road, Chetpet, Chennai",
      latitude: 13.0722,
      longitude: 80.2396,
      zone: "Zone 7 - Ambattur / Chetpet"
    },
    severity: "HIGH",
    priorityScore: 89,
    status: "IN_PROGRESS",
    createdAt: "2026-08-30T11:45:00.000Z",
    assignedDepartment: "Parks & Urban Forestry",
    slaDays: 2,
    slaDueDate: "2026-09-01T11:45:00.000Z",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Tree Hazard / High Tension Wire Proximity",
      confidence: 95,
      severity: "HIGH",
      recommendation: "Deploy hydraulic pruning lift unit with power grid shutdown."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-30 11:45 AM", icon: "📝", by: "Citizen (Sundar)" },
      { status: "AI_VERIFIED", label: "AI Verified Hazard", time: "2026-08-30 11:46 AM", icon: "✨", by: "CivicTrack AI Engine" },
      { status: "ASSIGNED", label: "Assigned to Forestry Dept", time: "2026-08-30 12:15 PM", icon: "🌲", by: "Parks Superintendent" },
      { status: "IN_PROGRESS", label: "Tree Pruning In Progress", time: "2026-08-31 08:30 AM", icon: "🪓", by: "Tree Pruning Squad" }
    ],
    citizenVerification: { promptActive: false, status: "PENDING", notes: "" }
  },
  {
    id: "CT-2026-001291",
    category: "Road Obstruction",
    categoryIcon: "🚧",
    title: "Unattended construction debris blocking bus stop lane",
    description: "Concrete slabs and gravel dumped illegally occupying two vehicle lanes.",
    location: {
      address: "GST Road, Near Guindy Metro Station",
      latitude: 13.0067,
      longitude: 80.2020,
      zone: "Zone 11 - Alandur / Guindy"
    },
    severity: "MEDIUM",
    priorityScore: 68,
    status: "AI_VERIFIED",
    createdAt: "2026-08-31T12:00:00.000Z",
    assignedDepartment: "Enforcement & Debris Removal",
    slaDays: 3,
    slaDueDate: "2026-09-03T12:00:00.000Z",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Illegal Debris Accumulation",
      confidence: 90,
      severity: "MEDIUM",
      recommendation: "Issue fine notice & send JCB earthmover for clearance."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-31 12:00 PM", icon: "📝", by: "Citizen (Nalini R.)" },
      { status: "AI_VERIFIED", label: "AI Prototype Verified", time: "2026-08-31 12:01 PM", icon: "✨", by: "CivicTrack AI Engine" }
    ],
    citizenVerification: { promptActive: false, status: "PENDING", notes: "" }
  },
  {
    id: "CT-2026-001292",
    category: "Pothole",
    categoryIcon: "🕳️",
    title: "Cluster of potholes near OMR IT Expressway Toll",
    description: "Multiple severe potholes causing bumper-to-bumper traffic backlog during evening commute.",
    location: {
      address: "OMR Expressway, Perungudi Toll Plaza, IT Corridor",
      latitude: 12.9654,
      longitude: 80.2488,
      zone: "Zone 14 - Sholinganallur"
    },
    severity: "HIGH",
    priorityScore: 88,
    status: "RESOLVED",
    createdAt: "2026-08-26T15:30:00.000Z",
    assignedDepartment: "Highways & IT Corridor Auth",
    slaDays: 3,
    slaDueDate: "2026-08-29T15:30:00.000Z",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Pothole Cluster (3+ detected)",
      confidence: 96,
      severity: "HIGH",
      recommendation: "Resurfacing stretch with hot-mix asphalt."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-26 03:30 PM", icon: "📝", by: "Citizen (Gokul)" },
      { status: "AI_VERIFIED", label: "AI Verified Pothole Cluster", time: "2026-08-26 03:31 PM", icon: "✨", by: "CivicTrack AI Engine" },
      { status: "ASSIGNED", label: "Assigned to Highways Dept", time: "2026-08-26 05:00 PM", icon: "👷", by: "Highways Officer" },
      { status: "IN_PROGRESS", label: "Asphalt Laying Night Shift", time: "2026-08-27 11:00 PM", icon: "🚜", by: "Road Crew Alpha" },
      { status: "RESOLVED", label: "Patch Work Completed", time: "2026-08-28 06:00 AM", icon: "✅", by: "Highways Inspector" }
    ],
    citizenVerification: {
      promptActive: true, // Needs verification!
      status: "PENDING",
      notes: ""
    }
  },
  {
    id: "CT-2026-001293",
    category: "Garbage",
    categoryIcon: "🗑️",
    title: "Plastic waste accumulation along canal bank",
    description: "Plastic bags dumped illegally along Buckingham Canal near Egmore Station.",
    location: {
      address: "Whannels Road, Near Egmore Railway Station",
      latitude: 13.0784,
      longitude: 80.2612,
      zone: "Zone 5 - Egmore"
    },
    severity: "LOW",
    priorityScore: 48,
    status: "SUBMITTED",
    createdAt: "2026-08-31T14:15:00.000Z",
    assignedDepartment: "Solid Waste Management",
    slaDays: 7,
    slaDueDate: "2026-09-07T14:15:00.000Z",
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Non-Biodegradable Plastic Dump",
      confidence: 86,
      severity: "LOW",
      recommendation: "Manual cleanup squad drive scheduled."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-08-31 02:15 PM", icon: "📝", by: "Citizen (Kavitha P.)" }
    ],
    citizenVerification: { promptActive: false, status: "PENDING", notes: "" }
  }
];

// Notifications Seed Data
const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Action Required: Verify Resolution",
    message: "Complaint CT-2026-001285 (Streetlight) has been marked fixed. Has this problem actually been fixed?",
    type: "VERIFICATION",
    complaintId: "CT-2026-001285",
    time: "10 minutes ago",
    read: false
  },
  {
    id: "notif-2",
    title: "Complaint Reopened & Escalated",
    message: "Complaint CT-2026-001287 (Drainage) was reopened by citizen. SLA SLA-24h exceeded.",
    type: "ESCALATION",
    complaintId: "CT-2026-001287",
    time: "2 hours ago",
    read: false
  },
  {
    id: "notif-3",
    title: "Status Update: In Progress",
    message: "Repair work started for CT-2026-001284 (Pothole at Anna Nagar).",
    type: "STATUS",
    complaintId: "CT-2026-001284",
    time: "Yesterday",
    read: true
  }
];

// Storage Controller Methods
export const StorageManager = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY_COMPLAINTS)) {
      this.resetDemoData();
    }
  },

  getAllRawComplaints() {
    const data = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
    return data ? JSON.parse(data) : [];
  },

  getComplaints() {
    const complaints = this.getAllRawComplaints();
    const user = this.getCurrentUser();
    if (user && user.id) {
      return complaints.filter(c => c.userId === user.id || !c.userId);
    }
    return complaints;
  },

  getComplaintById(id) {
    const complaints = this.getAllRawComplaints();
    return complaints.find(c => c.id === id) || null;
  },

  saveComplaint(complaint) {
    const complaints = this.getAllRawComplaints();
    const user = this.getCurrentUser();
    if (user && user.id && !complaint.userId) {
      complaint.userId = user.id;
    }
    complaints.unshift(complaint);
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
    return complaint;
  },

  updateComplaint(updatedComplaint) {
    let complaints = this.getAllRawComplaints();
    const index = complaints.findIndex(c => c.id === updatedComplaint.id);
    if (index !== -1) {
      complaints[index] = updatedComplaint;
      localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
      return updatedComplaint;
    }
    return null;
  },

  deleteComplaint(id) {
    let complaints = this.getAllRawComplaints();
    complaints = complaints.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
    return true;
  },

  getNotifications() {
    const data = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
  },

  saveNotifications(notifs) {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifs));
  },

  addNotification(notif) {
    const list = this.getNotifications();
    list.unshift(notif);
    this.saveNotifications(list);
  },

  getSettings() {
    const defaultSettings = {
      language: 'en', // 'en' | 'ta'
      theme: 'dark',  // 'dark' | 'light'
      gpsPermission: 'prompt', // 'granted' | 'denied' | 'prompt'
      userName: 'Karthik Raja',
      userEmail: 'karthik.citizen@civictrack.ai',
      userPhone: '+91 98765 43210'
    };
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : defaultSettings;
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  },

  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    if (data) {
      try { return JSON.parse(data); } catch (e) {}
    }
    // Default fallback demo user if logged out or uninitialized
    return {
      id: 1,
      fullName: 'Karthik Raja',
      email: 'karthik.citizen@civictrack.ai',
      phone: '+91 98765 43210',
      role: 'Citizen',
      avatar: 'KR'
    };
  },

  getAuthToken() {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || '';
  },

  saveUserSession(user, token) {
    if (user) localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token);
    
    // Also sync user info with settings
    const settings = this.getSettings();
    if (user) {
      settings.userName = user.fullName || settings.userName;
      settings.userEmail = user.email || settings.userEmail;
      settings.userPhone = user.phone || settings.userPhone;
      this.saveSettings(settings);
    }
  },

  clearUserSession() {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  },

  isLoggedIn() {
    return !!localStorage.getItem(STORAGE_KEY_USER);
  },

  resetDemoData() {
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_DEMO_COMPLAINTS;
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEY_COMPLAINTS);
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
};

