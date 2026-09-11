/* ==========================================================================
   Notifications Drawer & View Controller
   ========================================================================== */

import { StorageManager } from './storage.js';

export const NotificationsController = {
  init() {
    this.updateBadge();
  },

  updateBadge() {
    const badgeEl = document.getElementById('notif-unread-badge');
    const list = StorageManager.getNotifications();
    const unreadCount = list.filter(n => !n.read).length;

    if (badgeEl) {
      if (unreadCount > 0) {
        badgeEl.style.display = 'block';
      } else {
        badgeEl.style.display = 'none';
      }
    }
  },

  render() {
    const container = document.getElementById('notifications-list-container');
    if (!container) return;

    const list = StorageManager.getNotifications();

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2.5rem;">
          <span style="font-size: 2.5rem;">🔔</span>
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-top: 0.5rem;">No Notifications</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem;">You are all caught up!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(n => `
      <div class="card" onclick="window.NotificationsController.handleNotifClick('${n.id}', '${n.complaintId}')" style="cursor: pointer; margin-bottom: 1rem; position: relative; ${!n.read ? 'border-left: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.05);' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: ${n.type === 'VERIFICATION' ? '#fbbf24' : n.type === 'ESCALATION' ? '#f87171' : 'var(--text-primary)'};">
            ${n.title}
          </h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${n.time}</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
          ${n.message}
        </p>
      </div>
    `).join('');
  },

  handleNotifClick(notifId, complaintId) {
    const list = StorageManager.getNotifications();
    const target = list.find(n => n.id === notifId);
    if (target) {
      target.read = true;
      StorageManager.saveNotifications(list);
      this.updateBadge();
    }
    if (complaintId) {
      location.hash = `#complaint-details?id=${complaintId}`;
    }
  }
};

window.NotificationsController = NotificationsController;
