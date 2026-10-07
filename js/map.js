/* ==========================================================================
   Civic Map Controller — Leaflet.js + OpenStreetMap Engine
   Interactive live map with complaint pins, popups, category/status filters
   ========================================================================== */

import { API } from './api.js';

// Status / severity color mapping
const PIN_COLORS = {
  SUBMITTED:        '#3b82f6',
  AI_VERIFIED:      '#8b5cf6',
  ASSIGNED:         '#06b6d4',
  IN_PROGRESS:      '#f59e0b',
  RESOLVED:         '#10b981',
  VERIFICATION_PENDING: '#f97316',
  CITIZEN_VERIFIED: '#059669',
  VERIFIED:         '#059669',
  CLOSED:           '#10b981',
  REOPENED:         '#ef4444'
};

const SEVERITY_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444'
};

export const MapController = {
  currentCategoryFilter: 'ALL',
  _map: null,
  _markers: [],
  _userMarker: null,
  _geoWatchId: null,
  _eventsBound: false,

  async init() {
    const container = document.getElementById('civic-map-viewport');
    if (!container) return;

    // Clean up previous map instance if navigating back
    this._cleanupMap(container);

    // Default center coordinates: Chennai Central
    const defaultCenter = [13.0827, 80.2707];

    if (typeof L !== 'undefined') {
      try {
        this._map = L.map('civic-map-viewport', {
          center: defaultCenter,
          zoom: 13,
          zoomControl: true,
          attributionControl: true
        });

        // OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(this._map);

        // Invalidate size after DOM layout reflow
        setTimeout(() => {
          if (this._map) this._map.invalidateSize();
        }, 150);
        setTimeout(() => {
          if (this._map) this._map.invalidateSize();
        }, 400);

        this.bindEvents();
        await this.renderPins();
        this._trackUserLocation();
        return;
      } catch (err) {
        console.warn('Leaflet initialization error, rendering SVG fallback:', err);
      }
    }

    // Fallback: Render interactive SVG map if Leaflet is unavailable
    this._renderSvgFallback(container);
  },

  _cleanupMap(container) {
    if (this._map) {
      try {
        this._map.remove();
      } catch (e) {
        console.warn('Error removing map instance:', e);
      }
      this._map = null;
    }
    this._markers = [];
    if (container && container._leaflet_id) {
      delete container._leaflet_id;
    }
    if (container) {
      container.innerHTML = '';
    }
  },

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;

    const filterPills = document.querySelectorAll('.map-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategoryFilter = e.currentTarget.dataset.filter || 'ALL';
        this.renderPins();
      });
    });

    const searchBox = document.getElementById('map-search-input');
    if (searchBox) {
      searchBox.addEventListener('input', (e) => {
        this.renderPins(e.target.value.trim().toLowerCase());
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this._map) {
        this._map.invalidateSize();
      }
    });
  },

  async renderPins(searchQuery = '') {
    if (!this._map) return;

    // Remove old markers
    if (this._markers) {
      this._markers.forEach(m => {
        try { this._map.removeLayer(m); } catch (e) {}
      });
    }
    this._markers = [];

    // Fetch complaints using API service (with automatic local storage fallback)
    let complaints = [];
    try {
      complaints = await API.getComplaints();
    } catch (e) {
      console.warn('Failed to load complaints via API, using StorageManager:', e);
    }

    if (!Array.isArray(complaints) || complaints.length === 0) {
      const { StorageManager } = await import('./storage.js');
      complaints = StorageManager.getComplaints();
    }

    // Filter complaints
    let filtered = [...complaints];

    if (this.currentCategoryFilter && this.currentCategoryFilter !== 'ALL') {
      const filterKey = this.currentCategoryFilter.toLowerCase();

      if (this.currentCategoryFilter === 'HIGH_PRIORITY') {
        filtered = filtered.filter(c =>
          c.severity === 'HIGH' || c.severity === 'CRITICAL' || c.status === 'REOPENED'
        );
      } else if (this.currentCategoryFilter === 'RESOLVED') {
        filtered = filtered.filter(c =>
          c.status === 'RESOLVED' || c.status === 'CITIZEN_VERIFIED' || c.status === 'VERIFIED' || c.status === 'CLOSED'
        );
      } else if (filterKey === 'pothole') {
        filtered = filtered.filter(c => {
          const cat = (c.category || '').toLowerCase();
          return cat.includes('pothole') || cat.includes('road');
        });
      } else if (filterKey === 'streetlight') {
        filtered = filtered.filter(c => {
          const cat = (c.category || '').toLowerCase();
          return cat.includes('streetlight') || cat.includes('light');
        });
      } else if (filterKey === 'garbage') {
        filtered = filtered.filter(c => {
          const cat = (c.category || '').toLowerCase();
          return cat.includes('garbage') || cat.includes('waste');
        });
      } else if (filterKey === 'drainage') {
        filtered = filtered.filter(c => {
          const cat = (c.category || '').toLowerCase();
          return cat.includes('drainage') || cat.includes('water');
        });
      } else {
        filtered = filtered.filter(c =>
          (c.category || '').toLowerCase().includes(filterKey)
        );
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.location?.address || c.address || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      );
    }

    // Plot Leaflet circle markers
    filtered.forEach(c => {
      const lat = parseFloat(c.location?.latitude ?? c.latitude);
      const lng = parseFloat(c.location?.longitude ?? c.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const color = SEVERITY_COLORS[c.severity] || PIN_COLORS[c.status] || '#3b82f6';
      const statusColor = PIN_COLORS[c.status] || '#3b82f6';
      const statusLabel = (c.status || 'SUBMITTED').replace(/_/g, ' ');

      const marker = L.circleMarker([lat, lng], {
        radius: 12,
        fillColor: color,
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.95
      });

      const addressText = c.location?.address || c.address || 'Chennai Central Zone';
      const severityBadge = `<span style="font-size:0.68rem;font-weight:700;padding:0.18rem 0.5rem;border-radius:99px;background:${color}22;color:${color};border:1px solid ${color}44;">${c.severity || 'HIGH'}</span>`;
      const statusBadge = `<span style="font-size:0.68rem;font-weight:700;padding:0.18rem 0.5rem;border-radius:99px;background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">${statusLabel}</span>`;

      const popupContent = `
        <div class="map-pin-popup">
          <div class="map-pin-popup-id">${c.id} · ${c.categoryIcon || '📋'} ${c.category}</div>
          <div class="map-pin-popup-title">${c.title}</div>
          <div class="map-pin-popup-addr">📍 ${addressText}</div>
          <div class="map-pin-popup-footer">
            <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">${statusBadge} ${severityBadge}</div>
            <button class="map-pin-popup-btn" onclick="location.hash='#complaint-details?id=${c.id}'">View Issue →</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300, minWidth: 220 });
      marker.addTo(this._map);
      this._markers.push(marker);
    });

    // Fit map bounds to encompass visible markers
    if (this._markers.length > 0) {
      try {
        const group = L.featureGroup(this._markers);
        this._map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 15 });
      } catch (e) {
        console.warn('Error adjusting bounds:', e);
      }
    }
  },

  _trackUserLocation() {
    if (!navigator.geolocation || !this._map) return;

    this._geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!this._map) return;
        const { latitude: lat, longitude: lng } = pos.coords;

        if (this._userMarker) {
          try { this._map.removeLayer(this._userMarker); } catch (e) {}
        }

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
      (err) => {
        // Location denied or unavailable — gracefully ignore
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 12000 }
    );
  },

  _renderSvgFallback(container) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#94a3b8;padding:2rem;text-align:center;">
        <div style="font-size:3rem;margin-bottom:1rem;">🗺️</div>
        <h3 style="color:#f8fafc;font-size:1.25rem;margin-bottom:0.5rem;">Interactive Civic Map (Chennai Zone Grid)</h3>
        <p style="max-width:440px;font-size:0.9rem;line-height:1.6;margin-bottom:1.5rem;">
          Connect to OpenStreetMap tiles or browse live complaints across city zones below.
        </p>
        <button class="btn btn-primary" onclick="location.hash='#complaints'">
          View Complaints Directory →
        </button>
      </div>
    `;
  },

  stopTracking() {
    if (this._geoWatchId !== null) {
      navigator.geolocation.clearWatch(this._geoWatchId);
      this._geoWatchId = null;
    }
  }
};

window.MapController = MapController;
