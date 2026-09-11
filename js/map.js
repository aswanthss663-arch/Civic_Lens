/* ==========================================================================
   Civic Map Controller — Leaflet.js + OpenStreetMap
   Interactive real map with complaint pins, popups, filter pills
   ========================================================================== */

import { API } from './api.js';

// Status / severity color mapping
const PIN_COLORS = {
  SUBMITTED:        '#3b82f6',
  AI_VERIFIED:      '#8b5cf6',
  ASSIGNED:         '#06b6d4',
  IN_PROGRESS:      '#f59e0b',
  RESOLVED:         '#10b981',
  CITIZEN_VERIFIED: '#059669',
  REOPENED:         '#ef4444'
};

const SEVERITY_COLORS = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444'
};

export const MapController = {
  currentCategoryFilter: 'ALL',
  _map: null,
  _markers: [],
  _userMarker: null,
  _geoWatchId: null,

  async init() {
    const container = document.getElementById('civic-map-viewport');
    if (!container) return;

    // Destroy old map instance if navigating back
    if (this._map) {
      this._map.remove();
      this._map = null;
    }

    // Default center: Chennai
    const defaultCenter = [13.0827, 80.2707];

    this._map = L.map('civic-map-viewport', {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true
    });

    // OpenStreetMap tiles (dark-friendly)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this._map);

    this.bindEvents();
    await this.renderPins();

    // Show user's location on the civic map too
    this._trackUserLocation();
  },

  bindEvents() {
    const filterPills = document.querySelectorAll('.map-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategoryFilter = e.currentTarget.dataset.filter;
        this.renderPins();
      });
    });

    const searchBox = document.getElementById('map-search-input');
    if (searchBox) {
      searchBox.addEventListener('input', (e) => {
        this.renderPins(e.target.value.toLowerCase());
      });
    }
  },

  async renderPins(searchQuery = '') {
    if (!this._map) return;

    // Remove old markers
    this._markers.forEach(m => this._map.removeLayer(m));
    this._markers = [];

    // Fetch all complaints (no auth scoping on map — public view)
    let complaints;
    try {
      const res = await fetch('http://localhost:8000/api/v1/complaints');
      complaints = res.ok ? await res.json() : [];
    } catch {
      const { StorageManager } = await import('./storage.js');
      complaints = StorageManager.getComplaints();
    }

    // Apply filter
    if (this.currentCategoryFilter !== 'ALL') {
      if (this.currentCategoryFilter === 'HIGH_PRIORITY') {
        complaints = complaints.filter(c => c.severity === 'HIGH' || c.severity === 'CRITICAL' || c.status === 'REOPENED');
      } else if (this.currentCategoryFilter === 'RESOLVED') {
        complaints = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED');
      } else {
        complaints = complaints.filter(c => c.category === this.currentCategoryFilter);
      }
    }

    if (searchQuery) {
      complaints = complaints.filter(c =>
        c.title.toLowerCase().includes(searchQuery) ||
        c.id.toLowerCase().includes(searchQuery) ||
        (c.location?.address || '').toLowerCase().includes(searchQuery)
      );
    }

    // Plot markers
    complaints.forEach(c => {
      const lat = c.location?.latitude;
      const lng = c.location?.longitude;
      if (!lat || !lng) return;

      const color = SEVERITY_COLORS[c.severity] || PIN_COLORS[c.status] || '#3b82f6';
      const statusColor = PIN_COLORS[c.status] || '#3b82f6';

      // Custom circle marker
      const marker = L.circleMarker([lat, lng], {
        radius: 11,
        fillColor: color,
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.9
      });

      const statusLabel = (c.status || '').replace(/_/g, ' ');
      const severityBadge = `<span style="font-size:0.68rem;font-weight:700;padding:0.15rem 0.45rem;border-radius:99px;background:${color}22;color:${color};border:1px solid ${color}44;">${c.severity}</span>`;
      const statusBadge  = `<span style="font-size:0.68rem;font-weight:700;padding:0.15rem 0.45rem;border-radius:99px;background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">${statusLabel}</span>`;

      const popupContent = `
        <div class="map-pin-popup">
          <div class="map-pin-popup-id">${c.id} · ${c.categoryIcon || '📋'} ${c.category}</div>
          <div class="map-pin-popup-title">${c.title}</div>
          <div class="map-pin-popup-addr">📍 ${c.location?.address || '—'}</div>
          <div class="map-pin-popup-footer">
            <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">${statusBadge} ${severityBadge}</div>
            <button class="map-pin-popup-btn" onclick="location.hash='#complaint-details?id=${c.id}'">View →</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 280 });
      marker.addTo(this._map);
      this._markers.push(marker);
    });

    // Fit map to markers if any
    if (this._markers.length > 0) {
      const group = L.featureGroup(this._markers);
      this._map.fitBounds(group.getBounds().pad(0.2));
    }
  },

  _trackUserLocation() {
    if (!navigator.geolocation || !this._map) return;

    this._geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // Remove old user marker
        if (this._userMarker) this._map.removeLayer(this._userMarker);

        // Pulsing div icon for user
        const userIcon = L.divIcon({
          className: '',
          html: '<div class="user-loc-dot"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        this._userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
          .addTo(this._map)
          .bindPopup('📍 <strong>Your current location</strong>');
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  },

  stopTracking() {
    if (this._geoWatchId !== null) {
      navigator.geolocation.clearWatch(this._geoWatchId);
      this._geoWatchId = null;
    }
  }
};

window.MapController = MapController;
