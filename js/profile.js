/* ==========================================================================
   Profile & Settings Controller (Theme, Language, Demo Data & Admin User Management)
   ========================================================================== */

import { StorageManager } from './storage.js';
import { API } from './api.js';
import { AppState } from './app.js';
import { AuthController } from './auth.js';

export const ProfileController = {
  async render() {
    const settings = StorageManager.getSettings();
    const currentUser = StorageManager.getCurrentUser();

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const langSelect = document.getElementById('profile-language');
    const themeSelect = document.getElementById('profile-theme');
    const gpsStatusText = document.getElementById('profile-gps-status');

    if (nameInput) nameInput.value = currentUser ? currentUser.fullName : settings.userName;
    if (emailInput) emailInput.value = currentUser ? currentUser.email : settings.userEmail;
    if (phoneInput) phoneInput.value = currentUser ? (currentUser.phone || '') : settings.userPhone;
    if (langSelect) langSelect.value = settings.language;
    if (themeSelect) themeSelect.value = settings.theme;

    if (gpsStatusText) {
      if (navigator.geolocation) {
        gpsStatusText.innerHTML = `<span style="color: #10b981; font-weight: 700;">✓ Active / Enabled</span>`;
      } else {
        gpsStatusText.innerHTML = `<span style="color: #ef4444; font-weight: 700;">✕ Geolocation Disabled</span>`;
      }
    }

    // Render Admin / Officer User Management if logged in as Admin or Municipal Officer
    this.renderUserManagement(currentUser);

    this.bindEvents();
  },

  async renderUserManagement(currentUser) {
    const adminCard = document.getElementById('admin-user-management-card');
    const container = document.getElementById('admin-users-table-container');

    if (!adminCard || !container) return;

    // Show card for Officers/Admins OR if user is logged in
    const isOfficer = currentUser && (currentUser.role === 'Municipal Officer' || currentUser.role === 'Officer' || currentUser.role === 'Admin');

    // Show User Management section
    adminCard.style.display = isOfficer ? 'block' : 'block';

    const users = await API.getUsers();

    if (!users || users.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.85rem;">No registered users found in database.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const isSelf = currentUser && currentUser.id === u.id;
              const isAdminOrOfficer = u.role === 'Municipal Officer' || u.role === 'Officer' || u.role === 'Admin';
              const roleBadgeClass = isAdminOrOfficer ? 'badge-in-progress' : 'badge-submitted';
              const btnText = isAdminOrOfficer ? '🗑️ Delete Admin' : '🗑️ Delete User';

              return `
                <tr>
                  <td style="font-family: monospace; font-weight: 700; color: #38bdf8;">#${u.id}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="background: rgba(56,189,248,0.2); width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: #38bdf8;">
                        ${u.avatar || '👤'}
                      </span>
                      <span style="font-weight: 700; color: var(--text-primary);">${u.fullName}</span>
                      ${isSelf ? '<span style="font-size: 0.68rem; padding: 0.1rem 0.4rem; background: rgba(16,185,129,0.2); color: #10b981; border-radius: 4px; font-weight: 700;">(YOU)</span>' : ''}
                    </div>
                  </td>
                  <td style="font-size: 0.82rem; color: var(--text-secondary);">${u.email}</td>
                  <td style="font-size: 0.82rem; color: var(--text-muted);">${u.phone || '—'}</td>
                  <td><span class="badge ${roleBadgeClass}">${u.role}</span></td>
                  <td>
                    ${isSelf ? `
                      <span style="font-size: 0.75rem; color: var(--text-muted);">Active Session</span>
                    ` : `
                      <button class="btn btn-danger" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; display: inline-flex; align-items: center; gap: 0.25rem;" onclick="window.ProfileController.handleDeleteUser(${u.id}, '${u.fullName.replace(/'/g, "\\'")}', '${u.email}', '${u.role}')">
                        ${btnText}
                      </button>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  async handleDeleteUser(userId, userName, userEmail, userRole) {
    const accountType = userRole || 'user';
    if (confirm(`⚠️ Are you sure you want to delete ${accountType} account "${userName}" (${userEmail})?\n\nThis will permanently purge this ${accountType} account and all associated complaints from the database.`)) {
      try {
        const res = await API.deleteUser(userId);
        AppState.showToast(res.message || `Account ${userName} deleted successfully from database.`, 'success');
        const currentUser = StorageManager.getCurrentUser();
        this.renderUserManagement(currentUser);
      } catch (err) {
        AppState.showToast(err.message || 'Failed to delete account.', 'error');
      }
    }
  },

  bindEvents() {
    const saveBtn = document.getElementById('btn-save-profile');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const phoneInput = document.getElementById('profile-phone');
        const langSelect = document.getElementById('profile-language');
        const themeSelect = document.getElementById('profile-theme');

        const updatedSettings = {
          ...StorageManager.getSettings(),
          userName: nameInput ? nameInput.value : 'Karthik Raja',
          userEmail: emailInput ? emailInput.value : 'karthik@civictrack.ai',
          userPhone: phoneInput ? phoneInput.value : '+91 98765 43210',
          language: langSelect ? langSelect.value : 'en',
          theme: themeSelect ? themeSelect.value : 'dark'
        };

        StorageManager.saveSettings(updatedSettings);

        const currentUser = StorageManager.getCurrentUser();
        if (currentUser) {
          currentUser.fullName = updatedSettings.userName;
          currentUser.email = updatedSettings.userEmail;
          currentUser.phone = updatedSettings.userPhone;
          StorageManager.saveUserSession(currentUser, StorageManager.getAuthToken());
          AuthController.updateUserHeader();
        }

        AppState.setTheme(updatedSettings.theme);
        AppState.setLanguage(updatedSettings.language);
        AppState.showToast('Profile & Settings updated successfully!', 'success');
      };
    }

    const logoutBtn = document.getElementById('btn-logout-profile');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        AuthController.logout();
      };
    }

    const btnLoadDemo = document.getElementById('btn-load-demo-data');
    if (btnLoadDemo) {
      btnLoadDemo.onclick = async () => {
        await API.resetDemoData();
        AppState.showToast('Demo data reloaded (10 sample complaints)', 'info');
        location.hash = '#dashboard';
      };
    }

    const btnClearDemo = document.getElementById('btn-clear-demo-data');
    if (btnClearDemo) {
      btnClearDemo.onclick = () => {
        if (confirm('Are you sure you want to clear all complaints data?')) {
          StorageManager.clearAllData();
          AppState.showToast('All complaints data cleared.', 'warning');
          location.hash = '#dashboard';
        }
      };
    }
  }
};

window.ProfileController = ProfileController;
