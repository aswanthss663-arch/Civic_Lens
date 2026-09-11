/* ==========================================================================
   Complaint Details View Controller
   Interactive Step Timeline, Citizen Verification Prompt,
   SLA Escalation Warnings, and Live Incident Location Tracking Map.
   ========================================================================== */

import { API } from './api.js';
import { AppState } from './app.js';

// Internal tracking state
let _incidentMap    = null;   // Leaflet map instance
let _incidentMarker = null;   // Red pin at incident
let _userMarker     = null;   // Blue pulsing dot for user
let _geoWatchId     = null;   // watchPosition handle

export const DetailsController = {
  currentComplaintId: null,

  async render(complaintId) {
    this.currentComplaintId = complaintId || 'CT-2026-001284';
    const container = document.getElementById('details-view-container');
    if (!container) return;

    // Stop any previous location watch
    this._stopTracking();

    const complaint = await API.getComplaintById(this.currentComplaintId);

    if (!complaint) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <h2>Complaint Not Found</h2>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Complaint ID ${this.currentComplaintId} does not exist.</p>
          <button class="btn btn-primary" onclick="location.hash='#complaints'">Back to Complaints</button>
        </div>
      `;
      return;
    }

    // Check SLA Expiry
    const isDelayed = new Date() > new Date(complaint.slaDueDate)
      && complaint.status !== 'CITIZEN_VERIFIED'
      && complaint.status !== 'RESOLVED';

    // Render Main Details Layout
    container.innerHTML = `
      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
        <button class="btn btn-secondary" onclick="location.hash='#complaints'">
          ← Back to Complaints
        </button>
        <button class="btn" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #f87171; font-size: 0.85rem; font-weight: 700; padding: 0.5rem 1rem;" onclick="window.DetailsController.deleteCurrentComplaint()">
          🗑️ Delete Complaint
        </button>
      </div>

      <!-- SLA Delay Escalation Notice -->
      ${isDelayed || complaint.status === 'REOPENED' ? `
        <div class="card" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
          <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
            <span style="font-size: 1.6rem; color: #ef4444;">⚠️</span>
            <div>
              <h4 style="font-size: 1rem; font-weight: 800; color: #f87171;">Complaint Delayed - Escalation Recommended</h4>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
                This complaint has exceeded its expected resolution time (${complaint.slaDays} Days SLA limit).
                Automatic notification routed to Zonal Executive Officer.
              </p>
            </div>
          </div>
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;">
        <!-- Left Side: Main Info & Interactive Timeline -->
        <div>
          <!-- Complaint Overview Header -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <div>
                <span style="font-size: 0.8rem; font-weight: 700; color: #38bdf8;">${complaint.id}</span>
                <h1 style="font-size: 1.4rem; font-weight: 800; margin-top: 0.2rem;">${complaint.title}</h1>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem;">
                  📍 ${complaint.location.address}
                </p>
              </div>
              <span class="badge badge-${complaint.status.toLowerCase().replace('_', '-')}">
                ${complaint.status.replace('_', ' ')}
              </span>
            </div>

            <p style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.6; margin-bottom: 1.25rem;">
              ${complaint.description}
            </p>

            ${complaint.image ? `
              <div style="border-radius: var(--radius-md); overflow: hidden; max-height: 280px; margin-bottom: 1.25rem;">
                <img src="${complaint.image}" alt="Issue photo" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
            ` : ''}

            <!-- AI Summary Callout Box -->
            <div style="background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: var(--radius-md); padding: 1rem;">
              <h4 style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.35rem;">
                <span>✨</span> AI Verification & Summary
              </h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                ${complaint.aiAnalysis.recommendation}
              </p>
              <div style="display: flex; gap: 1.5rem; font-size: 0.78rem;">
                <span>Dept: <strong style="color: var(--text-primary);">${complaint.assignedDepartment}</strong></span>
                <span>Severity: <strong class="severity-${complaint.severity.toLowerCase()}">${complaint.severity}</strong></span>
                <span>Score: <strong style="color: #f97316;">${complaint.priorityScore}/100</strong></span>
              </div>
            </div>
          </div>

          <!-- CITIZEN VERIFICATION PROMPT -->
          ${this.renderCitizenVerificationCard(complaint)}

          <!-- Live Incident Tracking Map -->
          ${this.renderTrackingMapHTML(complaint)}

          <!-- Interactive Timeline -->
          <div class="card">
            <h3 class="card-title" style="margin-bottom: 1.5rem;">
              <span>📍</span> Live Action Tracking Timeline
            </h3>
            ${this.renderTimeline(complaint)}
          </div>
        </div>

        <!-- Right Side: Details Metadata -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div class="card">
            <h3 class="card-title" style="font-size: 1rem; margin-bottom: 1rem;">Metadata Details</h3>
            <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.85rem;">
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">POSTED BY USER</div>
                <div style="font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 0.4rem; margin-top: 0.15rem;">
                  <span style="background: rgba(56,189,248,0.2); width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.68rem;">${complaint.postedBy?.avatar || '👤'}</span>
                  <span>${complaint.postedBy?.fullName || 'Citizen User'}</span>
                  <span style="font-size: 0.7rem; color: var(--text-muted);">(${complaint.postedBy?.role || 'Citizen'})</span>
                </div>
                ${complaint.postedBy?.email ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.1rem;">✉️ ${complaint.postedBy.email}</div>` : ''}
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">COMPLAINT ID</div>
                <div style="font-weight: 700; font-family: monospace;">${complaint.id}</div>
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">CATEGORY</div>
                <div style="font-weight: 600;">${complaint.categoryIcon} ${complaint.category}</div>
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">REPORTED DATE</div>
                <div style="font-weight: 600;">${new Date(complaint.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">TARGET SLA DEADLINE</div>
                <div style="font-weight: 600; color: ${isDelayed ? '#ef4444' : '#10b981'};">
                  ${new Date(complaint.slaDueDate).toLocaleDateString()} (${complaint.slaDays} Days)
                </div>
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">COORDINATES</div>
                <div style="font-weight: 600; font-family: monospace; font-size: 0.8rem;">
                  ${complaint.location.latitude.toFixed(5)}, ${complaint.location.longitude.toFixed(5)}
                </div>
              </div>
              <div>
                <div style="color: var(--text-muted); font-size: 0.75rem;">ZONE</div>
                <div style="font-weight: 600;">${complaint.location.zone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize the Leaflet tracking map after DOM is ready
    setTimeout(() => this._initTrackingMap(complaint), 100);
  },

  // ── Live Tracking Map HTML Shell ─────────────────────────────────────────
  renderTrackingMapHTML(complaint) {
    const lat = complaint.location.latitude;
    const lng = complaint.location.longitude;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    return `
      <div class="live-tracking-panel" style="margin-bottom: 1.5rem;">
        <div class="live-tracking-header">
          <div class="live-tracking-title">
            <span class="track-icon">🗺️</span>
            Incident Location &amp; Live Tracking
          </div>
          <div class="live-tracking-badges">
            <span class="tracking-badge incident-marker">🔴 Incident</span>
            <span class="tracking-badge gps-live"><span class="td"></span> 🔵 Your Position</span>
          </div>
        </div>

        <div id="incident-tracking-map"></div>

        <div class="distance-info-bar">
          <div class="distance-block">
            <span class="distance-icon">📏</span>
            <div>
              <div class="distance-label">Distance from you</div>
              <div class="distance-value" id="tracking-distance">Calculating...</div>
            </div>
          </div>
          <div class="distance-block">
            <span class="distance-icon">📍</span>
            <div>
              <div class="distance-label">Incident coords</div>
              <div class="distance-value" style="font-size:0.85rem;">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
            </div>
          </div>
          <a class="navigate-btn" href="${mapsUrl}" target="_blank" rel="noopener">
            🧭 Navigate There
          </a>
        </div>
      </div>
    `;
  },

  // ── Init Leaflet map in the tracking panel ────────────────────────────────
  _initTrackingMap(complaint) {
    const el = document.getElementById('incident-tracking-map');
    if (!el || typeof L === 'undefined') return;

    // Clean up old map
    if (_incidentMap) { _incidentMap.remove(); _incidentMap = null; }

    const incidentLat = complaint.location.latitude;
    const incidentLng = complaint.location.longitude;

    _incidentMap = L.map('incident-tracking-map', {
      center: [incidentLat, incidentLng],
      zoom: 16
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(_incidentMap);

    // ── Red incident marker ──────────────────────────────────────────────
    const incidentIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;border-radius:50%;
        background:#ef4444;border:3px solid white;
        box-shadow:0 0 0 4px rgba(239,68,68,0.3),0 4px 12px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        font-size:14px;
      ">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    _incidentMarker = L.marker([incidentLat, incidentLng], { icon: incidentIcon })
      .addTo(_incidentMap)
      .bindPopup(`
        <div style="padding:0.5rem;">
          <div style="font-weight:700;font-size:0.88rem;margin-bottom:0.25rem;">${complaint.title}</div>
          <div style="font-size:0.75rem;color:#64748b;">📍 ${complaint.location.address}</div>
          <div style="margin-top:0.4rem;font-size:0.72rem;font-weight:700;color:#ef4444;">🔴 Incident Location</div>
        </div>
      `, { maxWidth: 250 })
      .openPopup();

    // ── Start watching user GPS ──────────────────────────────────────────
    this._startUserTracking(incidentLat, incidentLng);
  },

  _startUserTracking(incidentLat, incidentLng) {
    if (!navigator.geolocation) {
      const distEl = document.getElementById('tracking-distance');
      if (distEl) distEl.innerText = 'GPS unavailable';
      return;
    }

    this._stopTracking();

    _geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: uLat, longitude: uLng, accuracy } = pos.coords;

        // Create / update user marker
        if (!_incidentMap) return;

        if (_userMarker) _incidentMap.removeLayer(_userMarker);

        const userIcon = L.divIcon({
          className: '',
          html: '<div class="user-loc-dot"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        _userMarker = L.marker([uLat, uLng], { icon: userIcon, zIndexOffset: 1000 })
          .addTo(_incidentMap)
          .bindPopup(`<div style="padding:0.35rem;font-size:0.8rem;font-weight:700;">📍 Your location<br><span style="color:#64748b;font-weight:400;">Accuracy: ±${Math.round(accuracy)}m</span></div>`);

        // Calculate & display distance
        const distKm = this._haversineDistance(uLat, uLng, incidentLat, incidentLng);
        const distEl = document.getElementById('tracking-distance');
        if (distEl) {
          distEl.innerText = distKm < 1
            ? `${Math.round(distKm * 1000)} m away`
            : `${distKm.toFixed(2)} km away`;
        }

        // Draw a dashed line between user and incident
        if (this._distanceLine) _incidentMap.removeLayer(this._distanceLine);
        this._distanceLine = L.polyline(
          [[uLat, uLng], [incidentLat, incidentLng]],
          { color: '#38bdf8', weight: 2, dashArray: '6 6', opacity: 0.7 }
        ).addTo(_incidentMap);
      },
      (err) => {
        const distEl = document.getElementById('tracking-distance');
        if (distEl) {
          distEl.innerText = err.code === 1
            ? 'Location denied'
            : 'GPS unavailable';
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  },

  _stopTracking() {
    if (_geoWatchId !== null) {
      navigator.geolocation.clearWatch(_geoWatchId);
      _geoWatchId = null;
    }
    if (_incidentMap) {
      _incidentMap.remove();
      _incidentMap = null;
      _incidentMarker = null;
      _userMarker = null;
    }
    this._distanceLine = null;
  },

  // Haversine formula: distance in km between two lat/lng points
  _haversineDistance(lat1, lng1, lat2, lng2) {
    const R  = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2
            + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // ── Citizen Verification ─────────────────────────────────────────────────
  renderCitizenVerificationCard(complaint) {
    if (complaint.status === 'RESOLVED' || (complaint.citizenVerification && complaint.citizenVerification.promptActive)) {
      return `
        <div class="card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1)); border: 2px solid #10b981; margin-bottom: 1.5rem; animation: pulseGlow 2s infinite;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <span style="font-size: 2rem;">🤝</span>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #34d399;">Citizen Verification Required</h3>
              <p style="font-size: 0.85rem; color: var(--text-primary);">
                The authority has marked this issue as <strong>RESOLVED</strong>. Please verify.
              </p>
            </div>
          </div>
          <p style="font-weight: 700; font-size: 1rem; margin-bottom: 1rem; color: #ffffff;">
            Has this problem actually been fixed on the ground?
          </p>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-success" style="padding: 0.75rem 1.5rem; font-size: 0.95rem;" onclick="window.DetailsController.handleCitizenConfirm(true)">
              ✓ YES, ISSUE FIXED
            </button>
            <button class="btn btn-danger" style="padding: 0.75rem 1.5rem; font-size: 0.95rem;" onclick="window.DetailsController.handleCitizenConfirm(false)">
              ✕ NO, STILL EXISTS
            </button>
          </div>
        </div>
      `;
    } else if (complaint.status === 'CITIZEN_VERIFIED') {
      return `
        <div class="card" style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">✅</span>
            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #34d399;">Citizen Verified & Case Closed</h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary);">
                Thank you! You verified that this issue was successfully resolved on the ground.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (complaint.status === 'REOPENED') {
      return `
        <div class="card" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem;">⚠️</span>
            <div>
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #f87171;">Reopened by Citizen Verification</h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary);">
                Citizen reported issue still exists. Escalation notice routed to Department Head.
              </p>
              ${complaint.citizenVerification.notes ? `<p style="font-size: 0.8rem; color: var(--text-primary); margin-top: 0.4rem; font-style: italic;">"${complaint.citizenVerification.notes}"</p>` : ''}
            </div>
          </div>
        </div>
      `;
    }
    return '';
  },

  // ── Timeline ─────────────────────────────────────────────────────────────
  renderTimeline(complaint) {
    return `
      <div style="display: flex; flex-direction: column; gap: 1.25rem; position: relative; padding-left: 1.5rem; border-left: 2px solid var(--border-color);">
        ${complaint.timeline.map(event => `
          <div style="position: relative; animation: fadeIn 0.3s ease;">
            <div style="position: absolute; left: -2.15rem; top: 0; width: 24px; height: 24px; border-radius: 50%; background: var(--bg-secondary); border: 2px solid #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
              ${event.icon || '✓'}
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">${event.label}</h4>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${event.time}</span>
              </div>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
                By: <strong>${event.by}</strong> ${event.notes ? `• "${event.notes}"` : ''}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ── Actions ──────────────────────────────────────────────────────────────
  async handleCitizenConfirm(isFixed) {
    if (isFixed) {
      await API.verifyCitizenResolution(this.currentComplaintId, true, 'Issue verified fixed on site.');
      AppState.showToast('Thank you! Solution verified and complaint closed.', 'success');
    } else {
      const reason = prompt('Please tell us why the issue is not fixed:', 'Problem still persists on site.');
      await API.verifyCitizenResolution(this.currentComplaintId, false, reason || 'Issue still exists.');
      AppState.showToast('Thank you. The issue has been reopened and escalated for further action.', 'warning');
    }
    this.render(this.currentComplaintId);
  },

  async deleteCurrentComplaint() {
    if (!this.currentComplaintId) return;

    if (confirm(`Are you sure you want to delete complaint ${this.currentComplaintId}? This action cannot be undone.`)) {
      const success = await API.deleteComplaint(this.currentComplaintId);
      if (success) {
        AppState.showToast(`Complaint ${this.currentComplaintId} deleted successfully.`, 'success');
        location.hash = '#complaints';
      } else {
        AppState.showToast(`Failed to delete complaint ${this.currentComplaintId}.`, 'error');
      }
    }
  }
};

window.DetailsController = DetailsController;
