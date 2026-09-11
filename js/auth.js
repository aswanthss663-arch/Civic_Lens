/* ==========================================================================
   CivicTrack AI - Authentication Controller (Sign In & Sign Up Views)
   ========================================================================== */

import { API } from './api.js';
import { StorageManager } from './storage.js';
import { AppState } from './app.js';

export const AuthController = {
  init() {
    this.bindEvents();
    this.updateUserHeader();
  },

  bindEvents() {
    // ------------------------------------------------------------------------
    // Sign In Form Submission
    // ------------------------------------------------------------------------
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
      signinForm.onsubmit = async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('signin-email');
        const passwordInput = document.getElementById('signin-password');
        const alertBox = document.getElementById('signin-alert');
        const submitBtn = document.getElementById('signin-submit-btn');

        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
          this.showAlert(alertBox, 'Please enter both email address and password.', 'danger');
          return;
        }

        try {
          this.setButtonLoading(submitBtn, true, 'Signing in...');
          this.hideAlert(alertBox);

          const res = await API.signIn(email, password);
          
          AppState.showToast(`Welcome back, ${res.user.fullName}!`, 'success');
          this.updateUserHeader();
          
          // Clear inputs
          emailInput.value = '';
          passwordInput.value = '';
          
          // Navigate to dashboard
          location.hash = '#dashboard';
        } catch (err) {
          this.showAlert(alertBox, err.message || 'Invalid credentials. Please try again.', 'danger');
        } finally {
          this.setButtonLoading(submitBtn, false, 'Sign In');
        }
      };
    }

    // ------------------------------------------------------------------------
    // Quick Demo Login Preset Buttons
    // ------------------------------------------------------------------------
    const btnDemoCitizen = document.getElementById('btn-demo-citizen');
    if (btnDemoCitizen) {
      btnDemoCitizen.onclick = () => {
        const emailInput = document.getElementById('signin-email');
        const passwordInput = document.getElementById('signin-password');
        if (emailInput) emailInput.value = 'karthik.citizen@civictrack.ai';
        if (passwordInput) passwordInput.value = 'password123';
        AppState.showToast('Demo Citizen credentials loaded!', 'info');
      };
    }

    const btnDemoOfficer = document.getElementById('btn-demo-officer');
    if (btnDemoOfficer) {
      btnDemoOfficer.onclick = () => {
        const emailInput = document.getElementById('signin-email');
        const passwordInput = document.getElementById('signin-password');
        if (emailInput) emailInput.value = 'officer.sundaram@civictrack.ai';
        if (passwordInput) passwordInput.value = 'password123';
        AppState.showToast('Demo Officer credentials loaded!', 'info');
      };
    }

    // ------------------------------------------------------------------------
    // Toggle Password Visibility (Sign In & Sign Up)
    // ------------------------------------------------------------------------
    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const targetId = btn.dataset.target;
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          const isPassword = targetInput.type === 'password';
          targetInput.type = isPassword ? 'text' : 'password';
          btn.innerText = isPassword ? '🙈' : '👁️';
        }
      };
    });

    // ------------------------------------------------------------------------
    // Sign Up Password Strength Meter
    // ------------------------------------------------------------------------
    const signupPasswordInput = document.getElementById('signup-password');
    if (signupPasswordInput) {
      signupPasswordInput.oninput = () => {
        this.updatePasswordStrength(signupPasswordInput.value);
      };
    }

    // ------------------------------------------------------------------------
    // Sign Up Form Submission
    // ------------------------------------------------------------------------
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.onsubmit = async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email');
        const phoneInput = document.getElementById('signup-phone');
        const passwordInput = document.getElementById('signup-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        const termsCheck = document.getElementById('signup-terms');
        const alertBox = document.getElementById('signup-alert');
        const submitBtn = document.getElementById('signup-submit-btn');

        const roleRadio = document.querySelector('input[name="signup-role"]:checked');
        const role = roleRadio ? roleRadio.value : 'Citizen';

        const fullName = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        if (!fullName || !email || !password) {
          this.showAlert(alertBox, 'Please complete all required fields.', 'danger');
          return;
        }

        if (password.length < 6) {
          this.showAlert(alertBox, 'Password must be at least 6 characters long.', 'warning');
          return;
        }

        if (password !== confirmPassword) {
          this.showAlert(alertBox, 'Passwords do not match. Please re-enter.', 'danger');
          return;
        }

        if (termsCheck && !termsCheck.checked) {
          this.showAlert(alertBox, 'Please agree to the Terms of Service & Privacy Policy.', 'warning');
          return;
        }

        try {
          this.setButtonLoading(submitBtn, true, 'Creating Account...');
          this.hideAlert(alertBox);

          const res = await API.signUp({
            fullName,
            email,
            password,
            phone,
            role
          });

          AppState.showToast(`Account created successfully! Welcome, ${res.user.fullName}.`, 'success');
          this.updateUserHeader();

          // Reset inputs
          signupForm.reset();
          
          // Navigate to dashboard
          location.hash = '#dashboard';
        } catch (err) {
          this.showAlert(alertBox, err.message || 'Registration failed. Please try again.', 'danger');
        } finally {
          this.setButtonLoading(submitBtn, false, 'Create Account');
        }
      };
    }
  },

  updatePasswordStrength(pwd) {
    const meterBar = document.getElementById('password-strength-bar');
    const meterLabel = document.getElementById('password-strength-label');
    if (!meterBar || !meterLabel) return;

    if (!pwd) {
      meterBar.style.width = '0%';
      meterBar.style.backgroundColor = 'transparent';
      meterLabel.innerText = '';
      return;
    }

    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    let width = '20%';
    let color = '#ef4444'; // Red
    let label = 'Weak';

    if (score >= 4) {
      width = '100%';
      color = '#10b981'; // Green
      label = 'Strong Password';
    } else if (score >= 2) {
      width = '60%';
      color = '#f59e0b'; // Amber
      label = 'Medium';
    }

    meterBar.style.width = width;
    meterBar.style.backgroundColor = color;
    meterLabel.innerText = label;
    meterLabel.style.color = color;
  },

  updateUserHeader() {
    const currentUser = StorageManager.getCurrentUser();
    const isLoggedIn = StorageManager.isLoggedIn();

    // Top Bar Avatar & Name
    const avatarEl = document.querySelector('.user-avatar-mini');
    if (avatarEl && currentUser) {
      avatarEl.innerText = currentUser.avatar || 'KR';
      avatarEl.title = `${currentUser.fullName} (${currentUser.role || 'Citizen'})`;
    }

    // Auth Navigation item links / buttons update
    const navProfile = document.querySelector('.nav-item[href="#profile"]');
    const navSignin = document.querySelector('.nav-item[href="#signin"]');

    if (navSignin) {
      navSignin.style.display = isLoggedIn ? 'none' : 'block';
    }
    if (navProfile) {
      navProfile.style.display = 'block';
    }

    // Update Profile view fields if rendered
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const roleBadge = document.getElementById('profile-role-badge');

    if (nameInput && currentUser) nameInput.value = currentUser.fullName;
    if (emailInput && currentUser) emailInput.value = currentUser.email;
    if (phoneInput && currentUser) phoneInput.value = currentUser.phone || '';
    if (roleBadge && currentUser) {
      roleBadge.innerText = currentUser.role || 'Citizen';
      roleBadge.className = `role-badge role-${(currentUser.role || 'citizen').toLowerCase().replace(' ', '-')}`;
    }
  },

  logout() {
    StorageManager.clearUserSession();
    AppState.showToast('You have been logged out.', 'info');
    this.updateUserHeader();
    location.hash = '#signin';
  },

  showAlert(alertEl, msg, type = 'danger') {
    if (!alertEl) return;
    alertEl.className = `alert alert-${type}`;
    alertEl.innerText = msg;
    alertEl.style.display = 'block';
  },

  hideAlert(alertEl) {
    if (!alertEl) return;
    alertEl.style.display = 'none';
  },

  setButtonLoading(btn, isLoading, defaultText) {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalText = defaultText;
      btn.innerHTML = `<span class="spinner-small"></span> ${defaultText}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = defaultText;
    }
  }
};
