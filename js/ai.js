/* ==========================================================================
   CivicTrack AI - Prototype AI Engine
   Simulates vision analysis, severity prediction, priority scoring,
   duplicate detection, smart report summaries, and macro civic insights.
   ========================================================================== */

export const AIEngine = {
  /**
   * Prototype Image Analysis Simulation
   */
  analyzeImage(categoryInput) {
    const category = categoryInput || 'Pothole';

    const aiKnowledgeMap = {
      'Pothole': {
        detection: 'Pothole detected',
        confidence: 94,
        severity: 'HIGH',
        recommendation: 'Cold-mix asphalt patch required. Inspect sub-base for water seepage.'
      },
      'Streetlight': {
        detection: 'Broken Luminaire / Lamp Failure',
        confidence: 89,
        severity: 'MEDIUM',
        recommendation: 'Replace LED driver module and inspect overhead wiring relay.'
      },
      'Garbage': {
        detection: 'Overflowing Solid Waste',
        confidence: 96,
        severity: 'HIGH',
        recommendation: 'Deploy heavy compactor truck unit immediately and sanitize area.'
      },
      'Drainage': {
        detection: 'Blocked Stormwater Drain',
        confidence: 97,
        severity: 'CRITICAL',
        recommendation: 'Dispatch suction tanker & high-pressure water jetting machine.'
      },
      'Traffic Signal': {
        detection: 'Traffic Controller Malfunction',
        confidence: 91,
        severity: 'HIGH',
        recommendation: 'Reset PLC phase relay and check power supply box.'
      },
      'Road Damage': {
        detection: 'Asphalt Trench Collapse',
        confidence: 88,
        severity: 'MEDIUM',
        recommendation: 'Sub-grade compaction & wet mix asphalt resurfacing required.'
      },
      'Road Obstruction': {
        detection: 'Unattended Debris / Blockage',
        confidence: 90,
        severity: 'MEDIUM',
        recommendation: 'Dispatch JCB earthmover for clearance and issue violation notice.'
      },
      'Public Property Damage': {
        detection: 'Hazardous Leaning Tree Branch',
        confidence: 93,
        severity: 'HIGH',
        recommendation: 'Prune branches immediately to clear high-tension electrical cables.'
      }
    };

    return aiKnowledgeMap[category] || {
      detection: 'Public Utility Anomaly Detected',
      confidence: 85,
      severity: 'MEDIUM',
      recommendation: 'Zonal inspector physical verification recommended.'
    };
  },

  /**
   * Calculate Priority Score (0-100)
   * Formula: Score = (Severity Base) + (Duplicate Weight) + (Public Impact Weight)
   */
  calculatePriorityScore(severity, duplicateCount = 0, isCriticalArea = true) {
    let baseScore = 50;

    switch (severity) {
      case 'CRITICAL': baseScore = 85; break;
      case 'HIGH': baseScore = 70; break;
      case 'MEDIUM': baseScore = 50; break;
      case 'LOW': baseScore = 30; break;
    }

    // Additional weights
    const duplicateBonus = Math.min(duplicateCount * 6, 12); // up to +12
    const locationBonus = isCriticalArea ? 5 : 0; // +5 for high traffic zones

    const total = Math.min(baseScore + duplicateBonus + locationBonus, 99);
    return Math.max(total, 15);
  },

  /**
   * Smart Summary Generator
   */
  generateSmartSummary(category, userDescription, imageAnalysis, locationAddress) {
    const deptMap = {
      'Pothole': 'Road Maintenance & Engineering',
      'Streetlight': 'Electrical Infrastructure Division',
      'Garbage': 'Solid Waste Management',
      'Drainage': 'Metro Water & Sewage Board',
      'Traffic Signal': 'Traffic Police & Signals Wing',
      'Road Damage': 'Highways & Engineering Dept',
      'Road Obstruction': 'Enforcement & Debris Removal',
      'Public Property Damage': 'Parks & Urban Forestry Wing'
    };

    const department = deptMap[category] || 'Zonal Municipal Office';

    return {
      issueCategory: category,
      severity: imageAnalysis.severity,
      location: locationAddress || 'GPS Location Captured',
      impactLevel: imageAnalysis.severity === 'HIGH' || imageAnalysis.severity === 'CRITICAL' ? 'High Impact on Public Safety & Traffic' : 'Moderate Local Impact',
      recommendedDepartment: department,
      summaryText: `High-priority report for ${category.toLowerCase()} identified at ${locationAddress || 'captured coordinates'}. ${imageAnalysis.recommendation} Assigned to ${department}.`
    };
  },

  /**
   * Duplicate Complaint Detector (Proximity + Category matching)
   */
  detectDuplicates(newCategory, newLat, newLng, existingComplaints) {
    if (!newLat || !newLng || !existingComplaints) return [];

    // Helper: Distance calculation using Haversine formula (meters)
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c; // distance in meters
    };

    const duplicates = existingComplaints.filter(c => {
      if (c.category !== newCategory) return false;
      const d = getDistance(newLat, newLng, c.location.latitude, c.location.longitude);
      return d <= 500; // Within 500 meters radius
    });

    return duplicates;
  },

  /**
   * Macro AI Insights Generator
   */
  generateInsights(complaints) {
    if (!complaints || complaints.length === 0) {
      return {
        topHotspot: 'N/A',
        mostCommonCategory: 'N/A',
        highRiskArea: 'N/A',
        repeatedCount: 0,
        recommendationText: 'Insufficient data for AI analytics.'
      };
    }

    // Count categories & zones
    const zoneCounts = {};
    const categoryCounts = {};

    complaints.forEach(c => {
      const z = c.location.zone || 'Central Zone';
      zoneCounts[z] = (zoneCounts[z] || 0) + 1;
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    const topHotspot = Object.keys(zoneCounts).reduce((a, b) => zoneCounts[a] > zoneCounts[b] ? a : b, 'Anna Nagar');
    const mostCommonCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'Pothole');

    return {
      topHotspot: topHotspot,
      mostCommonCategory: mostCommonCategory,
      highRiskArea: 'Central Junction & Anna Nagar 2nd Ave',
      repeatedCount: zoneCounts[topHotspot] || 4,
      recommendationText: `Priority recommendation: Deploy proactive inspection squad to ${topHotspot}. Drainage and pothole reports recurring in high-density corridors.`
    };
  }
};
