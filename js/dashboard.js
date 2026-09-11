/* ==========================================================================
   Dashboard View Controller
   — Live DB stats (auto-refresh every 15s via /api/v1/dashboard/live)
   — Live GPS location widget with reverse geocoding
   — DB connection status badge
   — Stat count-up animation
   ========================================================================== */

import { API } from './api.js';
import { StorageManager } from './storage.js';

// ── Internal state ──────────────────────────────────────────────────────────
let _liveRefreshTimer   = null;   // setInterval handle for stats polling
let _geoWatchId         = null;   // navigator.geolocation.watchPosition handle
let _lastUpdateSec      = 0;      // seconds since last successful refresh
let _lastUpdateTimer    = null;   // setInterval for "X seconds ago" counter
let _liveCoords         = null;   // { lat, lng, accuracy } stored for report pre-fill

// Status badge configuration
const DB_CONFIG = {
  postgresql: { cls: 'status-connected', label: '🟢 PostgreSQL Live' },
  sqlite:     { cls: 'status-sqlite',    label: '🟡 SQLite Connected' },
  localstorage: { cls: 'status-offline', label: '⚫ Local Storage' },
  offline:    { cls: 'status-offline',   label: '⚫ Backend Offline' }
};

export const DashboardController = {

  // ── Main render entry point ──────────────────────────────────────────────
  async render() {
    // Start live DB stats refresh (only if not already running)
    this.startLiveRefresh();

    // Start live GPS location widget
    this.initLiveLocation();

    // Refresh DB badge on every dashboard load
    this.checkAndUpdateDBStatus();
  },

  // ── Fetch + display combined live stats ─────────────────────────────────
  async fetchAndRender() {
    try {
      const data = await API.getDashboardLive();

      // Update stat cards with flash animation
      this._updateStat('dash-stat-total',        data.stats.total);
      this._updateStat('dash-stat-resolved',     data.stats.resolved);
      this._updateStat('dash-stat-pending',      data.stats.pending);
      this._updateStat('dash-stat-high-priority',data.stats.highPriority);

      // Render recent activity feed
      this._renderActivityFeed(data.recentComplaints);

      // Update "last updated" timestamp
      _lastUpdateSec = 0;
      this._updateLastUpdatedText();

    } catch (err) {
      console.warn('Dashboard live fetch error:', err.message);
    }
  },

  // ── Stat update with flash animation ────────────────────────────────────
  _updateStat(elementId, newValue) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const formatted = typeof newValue === 'number'
      ? newValue.toLocaleString()
      : String(newValue);

    if (el.innerText !== formatted) {
      el.innerText = formatted;
      el.classList.remove('updating');
      // Force reflow to restart animation
      void el.offsetWidth;
      el.classList.add('updating');
    }
  },

  // ── Render recent activity feed ──────────────────────────────────────────
  _renderActivityFeed(complaints) {
    const activityContainer = document.getElementById('dashboard-recent-activity');
    if (!activityContainer) return;

    if (!complaints || complaints.length === 0) {
      activityContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No recent activity.</p>`;
      return;
    }

    const statusColors = {
      SUBMITTED:        '#3b82f6',
      AI_VERIFIED:      '#8b5cf6',
      ASSIGNED:         '#06b6d4',
      IN_PROGRESS:      '#f59e0b',
      RESOLVED:         '#10b981',
      CITIZEN_VERIFIED: '#059669',
      REOPENED:         '#ef4444'
    };

    activityContainer.innerHTML = complaints.map(c => {
      const statusColor = statusColors[c.status] || '#94a3b8';
      const statusLabel = c.status.replace(/_/g, ' ');
      const timeAgo = c.createdAt ? this._timeAgo(c.createdAt) : '';
      return `
        <div class="activity-item" onclick="location.hash='#complaint-details?id=${c.id}'" style="cursor: pointer;">
          <div class="activity-badge">${c.categoryIcon || '📋'}</div>
          <div class="activity-content">
            <div class="activity-title">${c.title}</div>
            <div class="activity-meta">
              <span>ID: <strong>${c.id}</strong></span>
              <span>•</span>
              <span style="color: ${statusColor}; font-weight: 600;">${statusLabel}</span>
              ${timeAgo ? `<span class="activity-time">• ${timeAgo}</span>` : ''}
            </div>
            ${c.address ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">📍 ${c.address}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Auto-refresh every 15 seconds ────────────────────────────────────────
  startLiveRefresh() {
    // Immediately fetch on first render
    this.fetchAndRender();

    // Clear any pre-existing interval (e.g. user navigated away and came back)
    this.stopLiveRefresh();

    _liveRefreshTimer = setInterval(() => {
      // Only refresh when dashboard is the active view
      if (document.getElementById('view-dashboard')?.classList.contains('active')) {
        this.fetchAndRender();
        _lastUpdateSec = 0;
      }
    }, 15000);

    // "X seconds ago" counter
    _lastUpdateTimer = setInterval(() => {
      _lastUpdateSec++;
      this._updateLastUpdatedText();
    }, 1000);
  },

  stopLiveRefresh() {
    if (_liveRefreshTimer) {
      clearInterval(_liveRefreshTimer);
      _liveRefreshTimer = null;
    }
    if (_lastUpdateTimer) {
      clearInterval(_lastUpdateTimer);
      _lastUpdateTimer = null;
    }
  },

  _updateLastUpdatedText() {
    const el = document.getElementById('dash-last-updated');
    if (!el) return;
    if (_lastUpdateSec < 5) {
      el.innerText = 'Updated just now';
    } else {
      el.innerText = `Updated ${_lastUpdateSec}s ago`;
    }
  },

  // ── Check backend health → update DB badge ───────────────────────────────
  async checkAndUpdateDBStatus() {
    const health = await API.checkBackendHealth();
    const dbType = health.db || 'offline';
    const cfg    = DB_CONFIG[dbType] || DB_CONFIG.offline;

    const badge = document.getElementById('db-status-badge');
    const text  = document.getElementById('db-status-text');

    if (badge) {
      badge.className = `db-status-badge ${cfg.cls}`;
    }
    if (text) {
      text.innerText = cfg.label;
    }
  },

  // ── Load public stats shown on the login page hero panel ─────────────────
  async loadLoginPageStats() {
    try {
      const data = await API.getDashboardLive();
      const total    = document.getElementById('login-stat-total');
      const resolved = document.getElementById('login-stat-resolved');
      const rate     = document.getElementById('login-stat-rate');

      if (total)    total.innerText    = data.stats.total.toLocaleString();
      if (resolved) resolved.innerText = data.stats.resolved.toLocaleString();
      if (rate)     rate.innerText     = `${data.stats.resolutionRate}%`;
    } catch (e) {
      // Stats unavailable — silently ignore; fallback values remain "—"
    }
  },

  // ── Live GPS Location Widget ─────────────────────────────────────────────
  initLiveLocation() {
    // Don't duplicate watchers
    if (_geoWatchId !== null) return;

    if (!navigator.geolocation) {
      this._setLocationError('📵 Geolocation is not supported by your browser.');
      return;
    }

    _geoWatchId = navigator.geolocation.watchPosition(
      (pos) => this._onLocationUpdate(pos),
      (err) => this._onLocationError(err),
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000
      }
    );
  },

  stopLiveLocation() {
    if (_geoWatchId !== null) {
      navigator.geolocation.clearWatch(_geoWatchId);
      _geoWatchId = null;
    }
  },

  async _onLocationUpdate(pos) {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;

    _liveCoords = { lat, lng, accuracy };

    // Store for the Report form to pre-fill
    try {
      const settings = StorageManager.getSettings();
      settings.lastLat = lat;
      settings.lastLng = lng;
      StorageManager.saveSettings(settings);
    } catch (_) {}

    // Update coordinate display
    const latEl = document.getElementById('live-lat');
    const lngEl = document.getElementById('live-lng');
    const accEl = document.getElementById('live-accuracy');
    const errEl = document.getElementById('live-location-error');

    if (latEl) latEl.innerText = lat.toFixed(6);
    if (lngEl) lngEl.innerText = lng.toFixed(6);
    if (accEl) accEl.innerText = `±${Math.round(accuracy)}m`;
    if (errEl) errEl.style.display = 'none';

    // Reverse geocode in background
    this._reverseGeocode(lat, lng);
  },

  _onLocationError(err) {
    const messages = {
      1: '🔒 Location permission denied. Enable it in browser settings.',
      2: '📡 Location unavailable. Check your device GPS.',
      3: '⏱️ Location request timed out. Retrying...'
    };
    this._setLocationError(messages[err.code] || '❓ Unknown location error.');
  },

  _setLocationError(msg) {
    const addrEl = document.getElementById('live-address');
    const errEl  = document.getElementById('live-location-error');
    const latEl  = document.getElementById('live-lat');
    const lngEl  = document.getElementById('live-lng');

    if (addrEl) addrEl.innerText = '—';
    if (latEl)  latEl.innerText  = '—';
    if (lngEl)  lngEl.innerText  = '—';
    if (errEl) {
      errEl.innerText = msg;
      errEl.style.display = 'block';
    }
  },

  async _reverseGeocode(lat, lng) {
    const addrEl = document.getElementById('live-address');
    if (!addrEl) return;

    try {
      addrEl.innerText = '🔍 Resolving address...';
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const json = await res.json();
        const addr = json.address || {};
        // Build a short human-readable address
        const parts = [
          addr.road || addr.pedestrian || addr.footway,
          addr.suburb || addr.neighbourhood || addr.quarter,
          addr.city || addr.town || addr.village,
          addr.state
        ].filter(Boolean);

        addrEl.innerText = parts.length > 0
          ? `📍 ${parts.join(', ')}`
          : `📍 ${json.display_name?.substring(0, 80) || 'Unknown location'}`;
      }
    } catch (e) {
      if (addrEl) addrEl.innerText = `📍 Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }
  },

  // ── Utility: Human-readable time ago ────────────────────────────────────
  _timeAgo(isoString) {
    const now  = Date.now();
    const then = new Date(isoString).getTime();
    if (isNaN(then)) return '';
    const diffMs = now - then;
    const mins  = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);

    if (days > 0)  return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0)  return `${mins}m ago`;
    return 'just now';
  }
};
