/* ==========================================================================
   CivicTrack AI - Main SPA Router & State Manager
   ========================================================================== */

import { StorageManager } from './storage.js';
import { DashboardController } from './dashboard.js';
import { ReportController } from './report.js';
import { ComplaintsController } from './complaints.js';
import { DetailsController } from './details.js';
import { MapController } from './map.js';
import { PublicDashboardController } from './public-dashboard.js';
import { InsightsController } from './insights.js';
import { NotificationsController } from './notifications.js';
import { ProfileController } from './profile.js';
import { AuthController } from './auth.js';


// English & Tamil UI Dictionary
const TRANSLATIONS = {
  en: {
    navDashboard: "Dashboard",
    navReport: "Report Issue",
    navComplaints: "My Complaints",
    navMap: "Civic Map",
    navPublic: "Public Dashboard",
    navInsights: "AI Insights",
    navNotifications: "Notifications",
    navProfile: "Profile & Settings",
    heroTitle: "Your city. Your voice. Your impact.",
    heroSub: "Report the Problem. Track the Action. Verify the Solution.",
    btnReportProblem: "+ Report a Problem"
  },
  ta: {
    navDashboard: "டாஷ்போர்டு",
    navReport: "புகார் அளிக்கவும்",
    navComplaints: "எனது புகார்கள்",
    navMap: "நகர வரைபடம்",
    navPublic: "பொது டாஷ்போர்டு",
    navInsights: "AI நுண்ணறிவு",
    navNotifications: "அறிவிப்புகள்",
    navProfile: "சுயவிவரம்",
    heroTitle: "உங்கள் நகரம். உங்கள் குரல். உங்கள் தாக்கம்.",
    heroSub: "Complaint poda mattum illa — resolution varaikkum track pannura system.",
    btnReportProblem: "+ புகார் பதிவு செய்"
  }
};

export const AppState = {
  currentLanguage: 'en',

  init() {
    StorageManager.init();
    
    const settings = StorageManager.getSettings();
    this.setTheme(settings.theme || 'dark');
    this.setLanguage(settings.language || 'en');

    NotificationsController.init();
    AuthController.init();

    this.bindGlobalEvents();

    this.handleRoute();

    window.addEventListener('hashchange', () => this.handleRoute());
  },

  bindGlobalEvents() {
    // Top Bar Language & Theme Toggles
    const btnLang = document.getElementById('top-lang-toggle');
    const btnTheme = document.getElementById('top-theme-toggle');

    if (btnLang) {
      btnLang.onclick = () => {
        const nextLang = this.currentLanguage === 'en' ? 'ta' : 'en';
        this.setLanguage(nextLang);
        const settings = StorageManager.getSettings();
        settings.language = nextLang;
        StorageManager.saveSettings(settings);
      };
    }

    if (btnTheme) {
      btnTheme.onclick = () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(nextTheme);
        const settings = StorageManager.getSettings();
        settings.theme = nextTheme;
        StorageManager.saveSettings(settings);
      };
    }
  },

  setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    const themeBtn = document.getElementById('top-theme-toggle');
    if (themeBtn) {
      themeBtn.innerHTML = themeName === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  },

  setLanguage(langCode) {
    this.currentLanguage = langCode;
    const t = TRANSLATIONS[langCode] || TRANSLATIONS.en;

    const btnLang = document.getElementById('top-lang-toggle');
    if (btnLang) {
      btnLang.innerHTML = langCode === 'en' ? '🌐 தமிழ்' : '🌐 English';
    }

    // Update Nav item labels
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (t[key]) el.innerText = t[key];
    });
  },

  handleRoute() {
    const rawHash = location.hash || '#dashboard';
    const [path, queryStr] = rawHash.split('?');
    const params = new URLSearchParams(queryStr || '');

    // Auth-related routes (no guard needed)
    const publicRoutes = ['#signin', '#signup'];
    const isLoggedIn = StorageManager.isLoggedIn();

    // Toggle login-mode body class — hides sidebar/header on auth screens
    if (publicRoutes.includes(path)) {
      document.body.classList.add('login-mode');
    } else {
      document.body.classList.remove('login-mode');
      // Auth guard: redirect to login if not authenticated
      if (!isLoggedIn) {
        location.hash = '#signin';
        return;
      }
    }

    // Stop any live tracking from previous views
    if (typeof DetailsController !== 'undefined' && path !== '#complaint-details') {
      DetailsController._stopTracking?.();
    }
    if (typeof MapController !== 'undefined' && path !== '#map') {
      MapController.stopTracking?.();
    }

    // Update Active Navigation State
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === path) {
        item.classList.add('active');
      }
    });

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

    const pageTitleEl = document.getElementById('current-page-title');

    switch (path) {
      case '#dashboard':
        document.getElementById('view-dashboard')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Dashboard Overview';
        DashboardController.render();
        break;

      case '#report':
        document.getElementById('view-report')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Report New Civic Issue';
        ReportController.init();
        break;

      case '#complaints':
        document.getElementById('view-complaints')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'My Complaints Track & Status';
        ComplaintsController.init();
        ComplaintsController.render();
        break;

      case '#complaint-details':
        document.getElementById('view-details')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Complaint Timeline & Action';
        const complaintId = params.get('id') || 'CT-2026-001284';
        DetailsController.render(complaintId);
        break;

      case '#map':
        document.getElementById('view-map')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Interactive Civic Map';
        MapController.init();
        break;

      case '#public-dashboard':
        document.getElementById('view-public-dashboard')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Public Transparency Analytics';
        PublicDashboardController.render();
        break;

      case '#insights':
        document.getElementById('view-insights')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'AI Predictive Intelligence & Insights';
        InsightsController.render();
        break;

      case '#notifications':
        document.getElementById('view-notifications')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Notifications';
        NotificationsController.render();
        break;

      case '#profile':
        document.getElementById('view-profile')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Profile & App Settings';
        ProfileController.render();
        break;

      case '#signin':
        document.getElementById('view-signin')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Sign In to CivicTrack AI';
        // Load public stats on login page hero panel
        DashboardController.loadLoginPageStats();
        break;

      case '#signup':
        document.getElementById('view-signup')?.classList.add('active');
        if (pageTitleEl) pageTitleEl.innerText = 'Create your CivicTrack Account';
        break;

      default:
        location.hash = isLoggedIn ? '#dashboard' : '#signin';
        break;
    }


    // Scroll to top
    window.scrollTo(0, 0);
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '🚨';

    toast.innerHTML = `
      <span style="font-size: 1.2rem;">${icon}</span>
      <div style="font-size: 0.85rem; font-weight: 600;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

window.AppState = AppState;

document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
});
