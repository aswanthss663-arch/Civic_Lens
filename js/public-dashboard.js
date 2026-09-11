/* ==========================================================================
   Public Dashboard View Controller (Transparency Analytics & Data Table)
   ========================================================================== */

import { API } from './api.js';

export const PublicDashboardController = {
  async render() {
    const stats = await API.getPublicStats();
    const complaints = await API.getComplaints();

    // Render Metric Cards
    const totalEl = document.getElementById('pub-stat-total');
    const resolvedEl = document.getElementById('pub-stat-resolved');
    const pendingEl = document.getElementById('pub-stat-pending');
    const highPriEl = document.getElementById('pub-stat-high-priority');
    const rateEl = document.getElementById('pub-stat-rate');

    if (totalEl) totalEl.innerText = stats.total.toLocaleString();
    if (resolvedEl) resolvedEl.innerText = stats.resolved.toLocaleString();
    if (pendingEl) pendingEl.innerText = stats.pending.toLocaleString();
    if (highPriEl) highPriEl.innerText = stats.highPriority.toLocaleString();
    if (rateEl) rateEl.innerText = stats.resolutionRate + '%';

    // Render Radial Gauge
    this.renderGauge(stats.resolutionRate);

    // Render Pure SVG Category Chart
    this.renderCategoryChart(stats.categories);

    // Render Area Breakdown Progress Bars
    this.renderAreaBreakdown(stats.areas);

    // Render Public Data Table Registry
    this.renderRegistryTable(complaints);
  },

  renderGauge(rate) {
    const gaugeContainer = document.getElementById('resolution-gauge-chart');
    if (!gaugeContainer) return;

    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (rate / 100) * circumference;

    gaugeContainer.innerHTML = `
      <div style="position: relative; width: 140px; height: 140px; margin: 0 auto;">
        <svg width="140" height="140" viewBox="0 0 120 120" style="transform: rotate(-90deg);">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--bg-tertiary)" stroke-width="10" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="url(#gauge-grad)" stroke-width="10" 
                  stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}" 
                  stroke-linecap="round" style="transition: stroke-dashoffset 1s ease;" />
          <defs>
            <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2563eb" />
              <stop offset="100%" stop-color="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary);">${rate}%</span>
          <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">SLA RESOLVED</span>
        </div>
      </div>
    `;
  },

  renderCategoryChart(categories) {
    const chartContainer = document.getElementById('category-bar-chart');
    if (!chartContainer) return;

    const keys = Object.keys(categories);
    const maxVal = Math.max(...Object.values(categories), 1);

    chartContainer.innerHTML = `
      <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 180px; padding-top: 1rem; border-bottom: 1px solid var(--border-color);">
        ${keys.map(cat => {
          const val = categories[cat];
          const heightPct = Math.max((val / maxVal) * 100, 15);
          return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex: 1;">
              <span style="font-size: 0.75rem; font-weight: 700; color: #38bdf8;">${val}</span>
              <div style="width: 28px; height: ${heightPct}%; background: linear-gradient(180deg, #38bdf8, #2563eb); border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
              <span style="font-size: 0.72rem; color: var(--text-secondary); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60px;">${cat}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderAreaBreakdown(areas) {
    const areaContainer = document.getElementById('area-distribution-list');
    if (!areaContainer) return;

    const keys = Object.keys(areas);
    const maxVal = Math.max(...Object.values(areas), 1);

    areaContainer.innerHTML = keys.map(area => {
      const val = areas[area];
      const widthPct = (val / maxVal) * 100;
      return `
        <div style="margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.25rem;">
            <span style="font-weight: 600;">${area}</span>
            <span style="color: var(--text-muted); font-weight: 700;">${val} Complaints</span>
          </div>
          <div style="width: 100%; height: 8px; background-color: var(--bg-tertiary); border-radius: var(--radius-full); overflow: hidden;">
            <div style="width: ${widthPct}%; height: 100%; background: linear-gradient(90deg, #2563eb, #06b6d4); border-radius: var(--radius-full); transition: width 0.6s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderRegistryTable(complaints) {
    const tableContainer = document.getElementById('public-registry-table-container');
    if (!tableContainer) return;

    tableContainer.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Issue Title</th>
              <th>Category</th>
              <th>Location</th>
              <th>Severity</th>
              <th>Priority Score</th>
              <th>Status</th>
              <th>Assigned Department</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(c => `
              <tr>
                <td style="font-family: monospace; font-weight: 700; color: #38bdf8;">${c.id}</td>
                <td style="font-weight: 600;">${c.title}</td>
                <td>${c.categoryIcon} ${c.category}</td>
                <td style="font-size: 0.82rem; color: var(--text-muted);">${c.location.address.split(',')[0]}</td>
                <td><span class="severity-${c.severity.toLowerCase()}" style="font-weight: 700;">${c.severity}</span></td>
                <td><strong style="color: #f97316;">${c.priorityScore}/100</strong></td>
                <td><span class="badge badge-${c.status.toLowerCase().replace('_', '-')}">${c.status.replace('_', ' ')}</span></td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${c.assignedDepartment}</td>
                <td>
                  <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;" onclick="location.hash='#complaint-details?id=${c.id}'">
                    View →
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};
