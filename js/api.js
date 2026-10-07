/* ==========================================================================
   Civic Lens - Frontend API Service Abstraction Layer
   Connected directly to Node.js Express Backend & Python FastAPI AI Service!
   ========================================================================== */

import { StorageManager } from './storage.js';

const BACKEND_BASE_URL = window.location.origin.includes('5001') || window.location.origin.includes('5000')
  ? '/api'
  : 'http://localhost:5001/api';


export const API = {
  // Returns Authorization header object if user is logged in
  _getAuthHeaders() {
    const token = StorageManager.getAuthToken();
    if (token) {
      return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    }
    return { 'Content-Type': 'application/json' };
  },

  _getAuthHeadersNoContent() {
    const token = StorageManager.getAuthToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  },

  /**
   * Fetch all complaints from Python FastAPI + PostgreSQL backend with LocalStorage fallback
   */
  async getComplaints(filter = {}) {
    try {
      const params = new URLSearchParams();
      if (filter.status && filter.status !== 'ALL') params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);
      if (filter.search) params.append('search', filter.search);

      const url = `${BACKEND_BASE_URL}/complaints?${params.toString()}`;
      const res = await fetch(url, { headers: this._getAuthHeadersNoContent() });
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Fetched complaints from Backend");
        return data;
      }
    } catch (e) {
      console.warn("Python backend unreachable, using LocalStorage fallback:", e.message);
    }

    // LocalStorage Fallback
    let complaints = StorageManager.getComplaints();
    if (filter.status && filter.status !== 'ALL') {
      complaints = complaints.filter(c => c.status === filter.status);
    }
    if (filter.category) {
      complaints = complaints.filter(c => c.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      complaints = complaints.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q)
      );
    }
    return complaints;
  },

  /**
   * Fetch single complaint details by ID from Python FastAPI + PostgreSQL
   */
  async getComplaintById(id) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/complaints/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Python backend error, falling back to LocalStorage:", e.message);
    }

    return StorageManager.getComplaintById(id);
  },

  /**
   * Create a new complaint report in PostgreSQL via Python FastAPI
   */
  async createComplaint(complaintData) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/complaints`, {
        method: 'POST',
        headers: this._getAuthHeaders(),
        body: JSON.stringify(complaintData)
      });
      if (res.ok) {
        const created = await res.json();
        console.log("✅ Created complaint in database:", created.id);
        StorageManager.saveComplaint(created); // Sync local copy
        return created;
      }
    } catch (e) {
      console.warn("Python backend offline, saving to LocalStorage:", e.message);
    }

    return StorageManager.saveComplaint(complaintData);
  },

  /**
   * Update complaint status in PostgreSQL via Python FastAPI
   */
  async updateComplaintStatus(id, newStatus, byUser = "System", notes = "") {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/complaints/${id}/status`, {
        method: 'PATCH',
        headers: this._getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, byUser, notes })
      });
      if (res.ok) {
        const updated = await res.json();
        console.log("✅ Updated complaint status in database:", newStatus);
        StorageManager.updateComplaint(updated);
        return updated;
      }
    } catch (e) {
      console.warn("Backend status update failed, fallback to LocalStorage:", e.message);
    }

    // LocalStorage Fallback
    const complaint = StorageManager.getComplaintById(id);
    if (!complaint) throw new Error("Complaint not found");

    complaint.status = newStatus;
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    let statusLabel = newStatus;
    let icon = "🔄";
    if (newStatus === "RESOLVED") {
      statusLabel = "Authority Marked Issue as Resolved";
      icon = "✅";
      complaint.citizenVerification.promptActive = true;
    } else if (newStatus === "CITIZEN_VERIFIED") {
      statusLabel = "Citizen Verified Solution";
      icon = "🤝";
      complaint.citizenVerification.promptActive = false;
      complaint.citizenVerification.status = "CONFIRMED";
      if (notes) complaint.citizenVerification.notes = notes;
    } else if (newStatus === "REOPENED") {
      statusLabel = "Citizen Verified Unresolved (Reopened)";
      icon = "⚠️";
      complaint.citizenVerification.promptActive = false;
      complaint.citizenVerification.status = "REJECTED";
      if (notes) complaint.citizenVerification.notes = notes;
    }

    complaint.timeline.push({
      status: newStatus,
      label: statusLabel,
      time: timestamp,
      icon: icon,
      by: byUser,
      notes: notes || undefined
    });

    return StorageManager.updateComplaint(complaint);
  },

  /**
   * Citizen Resolution Verification Response
   */
  async verifyCitizenResolution(id, isFixed, notes = "") {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/complaints/${id}/verify`, {
        method: 'POST',
        headers: this._getAuthHeaders(),
        body: JSON.stringify({ isFixed, notes })
      });
      if (res.ok) {
        const updated = await res.json();
        StorageManager.updateComplaint(updated);
        return updated;
      }
    } catch (e) {
      console.warn("Backend verify API failed, using LocalStorage:", e.message);
    }

    const targetStatus = isFixed ? "CITIZEN_VERIFIED" : "REOPENED";
    return this.updateComplaintStatus(id, targetStatus, "Citizen (Verification)", notes);
  },

  /**
   * Get public dashboard statistics from Python FastAPI + PostgreSQL
   */
  async getPublicStats() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/stats/public`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend public stats API failed, using LocalStorage fallback:", e.message);
    }

    const complaints = StorageManager.getComplaints();
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === "RESOLVED" || c.status === "CITIZEN_VERIFIED").length;
    const pending = complaints.filter(c => c.status !== "RESOLVED" && c.status !== "CITIZEN_VERIFIED").length;
    const highPriority = complaints.filter(c => c.severity === "HIGH" || c.severity === "CRITICAL").length;
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";

    const categories = {};
    complaints.forEach(c => categories[c.category] = (categories[c.category] || 0) + 1);

    const areas = {};
    complaints.forEach(c => {
      const zone = c.location.zone || "Central City";
      areas[zone] = (areas[zone] || 0) + 1;
    });

    return {
      total, resolved, pending, highPriority,
      resolutionRate: parseFloat(resolutionRate),
      categories, areas
    };
  },

  /**
   * Sign In user via Python FastAPI backend with LocalStorage fallback
   */
  async signIn(email, password) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        StorageManager.saveUserSession(data.user, data.accessToken);
        return data;
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Sign in failed.');
      }
    } catch (e) {
      if (e.message !== 'Invalid email or password. Please check your credentials.' && !e.message.includes('Sign in failed')) {
        console.warn("FastAPI backend offline, using LocalStorage demo signin:", e.message);
        // Fallback demo logins
        const isOfficer = email.toLowerCase().includes('officer');
        const demoUser = {
          id: isOfficer ? 2 : 1,
          fullName: isOfficer ? 'Er. Sundaram P.' : 'Karthik Raja',
          email: email,
          phone: isOfficer ? '+91 44 2888 1001' : '+91 98765 43210',
          role: isOfficer ? 'Municipal Officer' : 'Citizen',
          avatar: isOfficer ? 'SP' : 'KR'
        };
        const token = `demo-token-${Date.now()}`;
        StorageManager.saveUserSession(demoUser, token);
        return { accessToken: token, user: demoUser };
      }
      throw e;
    }
  },

  /**
   * Sign Up new user via Python FastAPI backend with LocalStorage fallback
   */
  async signUp(userData) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: userData.fullName,
          email: userData.email,
          password: userData.password,
          phone: userData.phone || '',
          role: userData.role || 'Citizen'
        })
      });
      if (res.ok) {
        const data = await res.json();
        StorageManager.saveUserSession(data.user, data.accessToken);
        return data;
      } else {
        const err = await res.json();
        throw new Error(err.detail || 'Sign up failed.');
      }
    } catch (e) {
      if (!e.message.includes('already exists') && !e.message.includes('Sign up failed')) {
        console.warn("FastAPI backend offline, registering in LocalStorage:", e.message);
        const parts = userData.fullName.split(' ');
        const avatar = (parts[0][0] + (parts[1] ? parts[1][0] : '')).upperCase();
        const newUser = {
          id: Date.now(),
          fullName: userData.fullName,
          email: userData.email,
          phone: userData.phone || '',
          role: userData.role || 'Citizen',
          avatar: avatar
        };
        const token = `demo-token-${Date.now()}`;
        StorageManager.saveUserSession(newUser, token);
        return { accessToken: token, user: newUser };
      }
      throw e;
    }
  },

  /**
   * Check backend health and active database type
   */
  async checkBackendHealth() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // backend offline
    }
    return { status: 'offline', db: 'localstorage' };
  },

  /**
   * Delete a complaint by ID
   */
  async deleteComplaint(id) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/complaints/${id}`, {
        method: 'DELETE',
        headers: this._getAuthHeadersNoContent()
      });
      if (res.ok) {
        console.log("✅ Deleted complaint from backend:", id);
        StorageManager.deleteComplaint(id);
        return true;
      }
    } catch (e) {
      console.warn("Backend delete API failed, fallback to LocalStorage:", e.message);
    }
    return StorageManager.deleteComplaint(id);
  },

  /**
   * Fetch combined live dashboard data (stats + recent complaints) in one call
   */
  async getDashboardLive() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/dashboard/live`, {
        headers: this._getAuthHeadersNoContent(),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Dashboard live endpoint unreachable, using fallback:', e.message);
    }

    // LocalStorage Fallback
    const stats = await this.getPublicStats();
    const complaints = await this.getComplaints();
    return {
      stats,
      recentComplaints: complaints.slice(0, 5).map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        categoryIcon: c.categoryIcon || '📋',
        status: c.status,
        severity: c.severity,
        address: c.location?.address || ''
      }))
    };
  },

  /**
   * Reset prototype PostgreSQL database
   */
  async resetDemoData() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/demo/reset`, { method: 'POST' });
      if (res.ok) {
        console.log("✅ PostgreSQL database reseeded via Python FastAPI backend!");
      }
    } catch (e) {
      console.warn("Python backend reset API failed, resetting LocalStorage:", e.message);
    }
    return StorageManager.resetDemoData();
  },

  /**
   * User Management (Admin / Officer)
   */
  async getUsers() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/users`, {
        headers: this._getAuthHeadersNoContent()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Backend getUsers API unreachable:", e.message);
    }
    return [];
  },

  async deleteUser(userId) {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: this._getAuthHeadersNoContent()
      });
      if (res.ok) {
        return await res.json();
      } else {
        const err = await res.json();
        throw new Error(err.detail || "Failed to delete user.");
      }
    } catch (e) {
      console.warn("Backend deleteUser API error:", e.message);
      throw e;
    }
  }
};
