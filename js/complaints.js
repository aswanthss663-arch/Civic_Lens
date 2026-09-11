/* ==========================================================================
   My Complaints View Controller & Multi-Status Filtering & Data Table View
   ========================================================================== */

import { API } from './api.js';

export const ComplaintsController = {
  currentFilter: 'ALL',
  searchQuery: '',
  viewMode: 'grid', // 'grid' | 'table'

  init() {
    this.bindEvents();
  },

  bindEvents() {
    const filterContainer = document.getElementById('complaints-filter-tabs');
    if (filterContainer) {
      filterContainer.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          filterContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.currentFilter = e.currentTarget.dataset.filter;
          this.render();
        });
      });
    }

    const searchInput = document.getElementById('complaints-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
      });
    }

    // View Mode Toggle (Grid vs Table)
    const btnGridView = document.getElementById('btn-view-grid');
    const btnTableView = document.getElementById('btn-view-table');

    if (btnGridView && btnTableView) {
      btnGridView.onclick = () => {
        btnGridView.classList.add('active');
        btnTableView.classList.remove('active');
        this.viewMode = 'grid';
        this.render();
      };

      btnTableView.onclick = () => {
        btnTableView.classList.add('active');
        btnGridView.classList.remove('active');
        this.viewMode = 'table';
        this.render();
      };
    }
  },

  async render() {
    const container = document.getElementById('complaints-list-grid');
    if (!container) return;

    let complaints = await API.getComplaints();

    // Apply Filter Tab
    if (this.currentFilter !== 'ALL') {
      complaints = complaints.filter(c => c.status === this.currentFilter);
    }

    // Apply Search
    if (this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      complaints = complaints.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }

    if (complaints.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem;" class="card">
          <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">🔍</span>
          <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem;">No Complaints Found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 400px; margin: 0 auto 1.5rem;">
            No reports match the selected status filter or search query.
          </p>
          <button class="btn btn-primary" onclick="location.hash='#report'">+ Report a Problem</button>
        </div>
      `;
      return;
    }

    if (this.viewMode === 'table') {
      container.style.gridTemplateColumns = '1fr';
      container.innerHTML = this.renderComplaintTable(complaints);
    } else {
      container.style.gridTemplateColumns = 'repeat(2, 1fr)';
      container.innerHTML = complaints.map(c => this.renderComplaintCard(c)).join('');
    }
  },

  async deleteComplaint(id, event) {
    if (event) event.stopPropagation();

    if (confirm(`Are you sure you want to delete complaint ${id}? This action cannot be undone.`)) {
      const { AppState } = await import('./app.js');
      const success = await API.deleteComplaint(id);
      if (success) {
        AppState.showToast(`Complaint ${id} deleted successfully.`, 'success');
        this.render();
      } else {
        AppState.showToast(`Failed to delete complaint ${id}.`, 'error');
      }
    }
  },

  renderComplaintCard(c) {
    const formattedDate = new Date(c.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    const statusBadgeClass = `badge-${c.status.toLowerCase().replace('_', '-')}`;
    const statusFormatted = c.status.replace('_', ' ');

    let verificationAlertHtml = '';
    if (c.status === 'RESOLVED' && c.citizenVerification && c.citizenVerification.promptActive) {
      verificationAlertHtml = `
        <div style="margin-top: 0.75rem; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; color: #fbbf24; font-weight: 600; display: flex; align-items: center; justify-content: space-between;">
          <span>❓ Action Needed: Verify Solution</span>
          <span style="text-decoration: underline;">Review →</span>
        </div>
      `;
    }

    return `
      <div class="card" onclick="location.hash='#complaint-details?id=${c.id}'" style="cursor: pointer; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.4rem;">${c.categoryIcon}</span>
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted);">${c.id}</span>
              <h3 style="font-size: 1rem; font-weight: 700; line-height: 1.2;">${c.title}</h3>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="badge ${statusBadgeClass}">${statusFormatted}</span>
            <button class="btn" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 6px;" title="Delete Complaint" onclick="window.ComplaintsController.deleteComplaint('${c.id}', event)">
              🗑️
            </button>
          </div>
        </div>

        <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.85rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${c.description}
        </p>

        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.85rem;">
          <span>👤 <strong>${c.postedBy?.fullName || 'Citizen'}</strong></span>
          <span>•</span>
          <span>📍 ${c.location.address.split(',')[0]}</span>
          <span>•</span>
          <span>📅 ${formattedDate}</span>
          <span>•</span>
          <span>Severity: <strong class="severity-${c.severity.toLowerCase()}">${c.severity}</strong></span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
          <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">
            Priority Score: <span style="color: #f97316; font-weight: 800;">${c.priorityScore}/100</span>
          </div>
          <div style="font-size: 0.78rem; color: #38bdf8; font-weight: 600;">
            Track Timeline →
          </div>
        </div>

        ${verificationAlertHtml}
      </div>
    `;
  },

  renderComplaintTable(complaints) {
    return `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category & Title</th>
              <th>Location</th>
              <th>Severity</th>
              <th>Priority Score</th>
              <th>Assigned Department</th>
              <th>Status</th>
              <th>Reported Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(c => {
              const formattedDate = new Date(c.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              });
              const statusBadgeClass = `badge-${c.status.toLowerCase().replace('_', '-')}`;
              const statusFormatted = c.status.replace('_', ' ');

              return `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: #38bdf8;">${c.id}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-size: 1.2rem;">${c.categoryIcon}</span>
                      <div>
                        <div style="font-weight: 700; color: var(--text-primary);">${c.title}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${c.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>${c.location.address.split(',')[0]}</td>
                  <td><span class="severity-${c.severity.toLowerCase()}" style="font-weight: 700;">${c.severity}</span></td>
                  <td><strong style="color: #f97316;">${c.priorityScore}/100</strong></td>
                  <td style="font-size: 0.8rem; color: var(--text-secondary);">${c.assignedDepartment}</td>
                  <td><span class="badge ${statusBadgeClass}">${statusFormatted}</span></td>
                  <td style="font-size: 0.8rem; color: var(--text-muted);">${formattedDate}</td>
                  <td>
                    <div style="display: flex; gap: 0.35rem;">
                      <button class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;" onclick="location.hash='#complaint-details?id=${c.id}'">
                        Track →
                      </button>
                      <button class="btn" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; font-size: 0.75rem; padding: 0.3rem 0.5rem; border-radius: 6px;" title="Delete Complaint" onclick="window.ComplaintsController.deleteComplaint('${c.id}', event)">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
};

window.ComplaintsController = ComplaintsController;
