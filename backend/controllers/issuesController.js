const db = require('../config/db');
const { classifyIssue, checkDuplicates } = require('../services/aiProxy');

// In-Memory store for fast fallback demonstration
const mockIssues = [
  {
    id: "CL-2026-00101",
    userId: 1,
    title: "Deep Dangerous Pothole near Anna Nagar Junction",
    description: "A 4-foot wide pothole near Anna Nagar 2nd Avenue causing severe traffic slowdown.",
    category: "Road Damage",
    categoryIcon: "🕳️",
    severity: "HIGH",
    priorityScore: 88,
    status: "IN_PROGRESS",
    location: {
      address: "Anna Nagar 2nd Avenue, Near Anna Arch, Chennai",
      latitude: 13.0850,
      longitude: 80.2101,
      zone: "Zone 8 - Anna Nagar"
    },
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Pothole / Road Damage",
      confidence: 94,
      severity: "HIGH",
      recommendation: "Cold-mix asphalt patch required. Inspect sub-base."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-10-06 09:30 AM", updated_by: "Karthik Raja" },
      { status: "AI_VERIFIED", label: "AI Classification Verified", time: "2026-10-06 09:31 AM", updated_by: "Civic Lens AI" },
      { status: "ASSIGNED", label: "Assigned to Road Engineering", time: "2026-10-06 10:15 AM", updated_by: "Officer Sundaram" },
      { status: "IN_PROGRESS", label: "Asphalt Patching In Progress", time: "2026-10-07 08:00 AM", updated_by: "Field Crew" }
    ],
    citizenVerification: {
      promptActive: false,
      status: "PENDING",
      notes: ""
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "CL-2026-00102",
    userId: 1,
    title: "Overflowing Garbage Bin on Commercial Street",
    description: "Trash dumping overflowing onto main walkway for past 3 days emitting strong odor.",
    category: "Garbage / Waste",
    categoryIcon: "🗑️",
    severity: "HIGH",
    priorityScore: 82,
    status: "RESOLVED",
    location: {
      address: "Parrys Corner, NSC Bose Road, Chennai",
      latitude: 13.0827,
      longitude: 80.2707,
      zone: "Zone 5 - Royapuram"
    },
    image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: {
      detection: "Garbage / Solid Waste",
      confidence: 96,
      severity: "HIGH",
      recommendation: "Deploy compactor truck unit immediately and sanitize."
    },
    timeline: [
      { status: "SUBMITTED", label: "Complaint Submitted", time: "2026-10-05 11:00 AM", updated_by: "Karthik Raja" },
      { status: "RESOLVED", label: "Compactor Clearance Completed", time: "2026-10-06 04:30 PM", updated_by: "Sanitation Squad" }
    ],
    citizenVerification: {
      promptActive: true,
      status: "PENDING",
      notes: ""
    },
    createdAt: new Date().toISOString()
  }
];

function formatIssueResponse(issue) {
  return {
    id: issue.id,
    userId: issue.userId || issue.user_id || 1,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    categoryIcon: issue.categoryIcon || issue.category_icon || "📋",
    severity: issue.severity || "HIGH",
    priorityScore: issue.priorityScore || issue.priority_score || 75,
    status: issue.status || "SUBMITTED",
    location: issue.location || {
      address: issue.address || "Captured Location",
      latitude: parseFloat(issue.latitude) || 13.0850,
      longitude: parseFloat(issue.longitude) || 80.2101,
      zone: issue.zone || "Central Zone"
    },
    image: issue.image || issue.image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    aiAnalysis: issue.aiAnalysis || {
      detection: issue.ai_category || `${issue.category} detected`,
      confidence: Math.round((issue.ai_confidence || 0.92) * 100),
      severity: issue.severity || "HIGH",
      recommendation: "High priority inspection recommended."
    },
    timeline: issue.timeline || [
      { status: "SUBMITTED", label: "Complaint Submitted", time: new Date().toISOString(), by: "Citizen" }
    ],
    citizenVerification: issue.citizenVerification || {
      promptActive: issue.status === "RESOLVED",
      status: issue.citizen_verification_status || "PENDING",
      notes: ""
    },
    duplicateOf: issue.duplicate_of || null,
    createdAt: issue.createdAt || issue.created_at || new Date().toISOString()
  };
}

module.exports = {
  // GET /api/issues
  async getIssues(req, res) {
    try {
      const { status, category, search } = req.query;
      let results = [...mockIssues];

      if (status && status !== 'ALL') {
        results = results.filter(i => i.status === status);
      }
      if (category) {
        results = results.filter(i => i.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(i => 
          i.title.toLowerCase().includes(q) || 
          i.id.toLowerCase().includes(q) ||
          i.location.address.toLowerCase().includes(q)
        );
      }

      res.json(results.map(formatIssueResponse));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // GET /api/issues/:id
  async getIssueById(req, res) {
    const { id } = req.params;
    const found = mockIssues.find(i => i.id === id);
    if (!found) {
      return res.status(404).json({ error: "Issue not found" });
    }
    res.json(formatIssueResponse(found));
  },

  // POST /api/issues
  async createIssue(req, res) {
    try {
      const data = req.body;
      if (!data.title || !data.description || !data.category) {
        return res.status(400).json({ error: "Missing required fields: title, description, category" });
      }

      const newId = data.id || `CL-2026-${Math.floor(100000 + Math.random() * 900000)}`;

      // Run AI Proxy Classification
      const aiResult = await classifyIssue(data);

      const issueObj = {
        id: newId,
        userId: data.userId || 1,
        title: data.title,
        description: data.description,
        category: data.category,
        categoryIcon: data.categoryIcon || "📋",
        severity: aiResult.severity || data.severity || "HIGH",
        priorityScore: aiResult.priority_score || 85,
        status: "SUBMITTED",
        location: {
          address: data.location?.address || data.address || "Anna Nagar, Chennai",
          latitude: parseFloat(data.location?.latitude || data.latitude || 13.0850),
          longitude: parseFloat(data.location?.longitude || data.longitude || 80.2101),
          zone: data.location?.zone || "Zone 8 - Anna Nagar"
        },
        image: data.image || data.image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
        aiAnalysis: {
          detection: aiResult.category,
          confidence: Math.round(aiResult.confidence * 100),
          severity: aiResult.severity,
          recommendation: aiResult.recommendation
        },
        timeline: [
          { status: "SUBMITTED", label: "Complaint Submitted", time: new Date().toLocaleString(), by: "Citizen" },
          { status: "AI_VERIFIED", label: `AI Verified (${aiResult.category})`, time: new Date().toLocaleString(), by: "Civic Lens AI" }
        ],
        citizenVerification: { promptActive: false, status: "PENDING", notes: "" },
        createdAt: new Date().toISOString()
      };

      mockIssues.unshift(issueObj);
      res.status(201).json(formatIssueResponse(issueObj));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  // PATCH /api/issues/:id/status
  async updateStatus(req, res) {
    const { id } = req.params;
    const { status, byUser, notes } = req.body;

    const issue = mockIssues.find(i => i.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    issue.status = status;
    let label = status;
    if (status === "RESOLVED") {
      label = "Authority Marked Issue as Resolved";
      issue.citizenVerification.promptActive = true;
    } else if (status === "VERIFIED" || status === "CITIZEN_VERIFIED") {
      label = "Citizen Verified Solution (CLOSED)";
      issue.status = "CLOSED";
      issue.citizenVerification.promptActive = false;
      issue.citizenVerification.status = "CONFIRMED";
    } else if (status === "REOPENED") {
      label = "Citizen Verification Rejected — Reopened";
      issue.citizenVerification.promptActive = false;
      issue.citizenVerification.status = "REJECTED";
    }

    issue.timeline.push({
      status: issue.status,
      label,
      time: new Date().toLocaleString(),
      by: byUser || "System Officer",
      notes: notes || ""
    });

    res.json(formatIssueResponse(issue));
  },

  // POST /api/issues/:id/evidence
  async uploadEvidence(req, res) {
    const { id } = req.params;
    const { image_url, description, uploaded_by } = req.body;

    const issue = mockIssues.find(i => i.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    issue.status = "RESOLVED";
    issue.evidence = {
      image_url: image_url || issue.image,
      description: description || "Resolution work completed by municipal team.",
      uploaded_by: uploaded_by || "Municipal Officer",
      uploaded_at: new Date().toISOString()
    };
    issue.citizenVerification.promptActive = true;

    issue.timeline.push({
      status: "RESOLVED",
      label: "Resolution Evidence Uploaded",
      time: new Date().toLocaleString(),
      by: uploaded_by || "Municipal Officer",
      notes: description || "Evidence uploaded"
    });

    res.json({ message: "Resolution evidence recorded", issue: formatIssueResponse(issue) });
  },

  // POST /api/issues/:id/verify
  async verifyResolution(req, res) {
    const { id } = req.params;
    const { isFixed, notes } = req.body;

    const issue = mockIssues.find(i => i.id === id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    if (isFixed) {
      issue.status = "CLOSED";
      issue.citizenVerification.promptActive = false;
      issue.citizenVerification.status = "CONFIRMED";
      issue.citizenVerification.notes = notes || "Citizen verified issue resolved successfully.";
      issue.timeline.push({
        status: "CLOSED",
        label: "Citizen Confirmed Resolution — Issue Closed",
        time: new Date().toLocaleString(),
        by: "Citizen",
        notes: notes || "Closed by reporter"
      });
    } else {
      issue.status = "REOPENED";
      issue.citizenVerification.promptActive = false;
      issue.citizenVerification.status = "REJECTED";
      issue.citizenVerification.notes = notes || "Issue still persists on site.";
      issue.timeline.push({
        status: "REOPENED",
        label: "Citizen Rejected Resolution — Issue Reopened & Escalated",
        time: new Date().toLocaleString(),
        by: "Citizen",
        notes: notes || "Reopened by reporter"
      });
    }

    res.json(formatIssueResponse(issue));
  }
};
