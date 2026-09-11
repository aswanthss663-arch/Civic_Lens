/* ==========================================================================
   Report Issue Controller & AI Scanning Logic
   ========================================================================== */

import { API } from './api.js';
import { AIEngine } from './ai.js';
import { AppState } from './app.js';

export const ReportController = {
  selectedCategory: 'Pothole',
  selectedSeverity: 'HIGH',
  currentImage: null,
  currentLocation: {
    address: 'Anna Nagar 2nd Avenue, Chennai',
    latitude: 13.0850,
    longitude: 80.2101,
    zone: 'Zone 8 - Anna Nagar'
  },
  aiAnalysis: null,
  priorityScore: 87,
  detectedDuplicates: [],

  init() {
    this.bindEvents();
    this.runAIScan();
  },

  bindEvents() {
    const reportForm = document.getElementById('report-issue-form');
    if (!reportForm) return;

    // Category Grid Selection
    const categoryOptions = document.querySelectorAll('.category-option');
    categoryOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        categoryOptions.forEach(o => o.classList.remove('selected'));
        const target = e.currentTarget;
        target.classList.add('selected');
        this.selectedCategory = target.dataset.category;
        
        // Re-run AI analysis simulation for category change
        this.runAIScan();
      });
    });

    // File Dropzone / File Input
    const dropzone = document.getElementById('image-dropzone');
    const fileInput = document.getElementById('image-file-input');
    const btnCamera = document.getElementById('btn-use-camera');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== btnCamera) fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageFile(e.target.files[0]);
        }
      });
    }

    if (btnCamera) {
      btnCamera.addEventListener('click', (e) => {
        e.stopPropagation();
        this.simulateCameraCapture();
      });
    }

    // Geolocation Button
    const btnGps = document.getElementById('btn-get-gps');
    if (btnGps) {
      btnGps.addEventListener('click', () => this.fetchGPSLocation());
    }

    // Form Submission
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitReport();
    });
  },

  handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentImage = e.target.result;
      this.updateImagePreview(this.currentImage);
      this.runAIScan();
    };
    reader.readAsDataURL(file);
  },

  simulateCameraCapture() {
    // Canvas generated mock image
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Draw realistic mock pothole / utility hazard backdrop
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(300, 200, 180, 100, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '20px sans-serif';
    ctx.fillText('📸 Camera Snap: ' + this.selectedCategory, 40, 50);

    this.currentImage = canvas.toDataURL('image/jpeg');
    this.updateImagePreview(this.currentImage);
    this.runAIScan();
  },

  updateImagePreview(imageSrc) {
    const previewImg = document.getElementById('upload-preview-img');
    const dropzonePrompt = document.getElementById('dropzone-prompt');
    if (previewImg && dropzonePrompt) {
      previewImg.src = imageSrc;
      previewImg.style.display = 'block';
      dropzonePrompt.style.display = 'none';
    }
  },

  runAIScan() {
    const aiCard = document.getElementById('ai-analysis-card');
    if (!aiCard) return;

    // Show scanning animation
    aiCard.innerHTML = `
      <div class="ai-scan-bar"></div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 1.5rem;" class="spin-anim">✨</span>
        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700;">AI Prototype Analyzing Image & Context...</h4>
          <p style="font-size: 0.78rem; color: var(--text-muted);">Detecting object contours, severity heuristics, and department routing...</p>
        </div>
      </div>
    `;

    setTimeout(async () => {
      this.aiAnalysis = AIEngine.analyzeImage(this.selectedCategory);
      this.selectedSeverity = this.aiAnalysis.severity;

      // Check duplicates
      const allComplaints = await API.getComplaints();
      this.detectedDuplicates = AIEngine.detectDuplicates(
        this.selectedCategory,
        this.currentLocation.latitude,
        this.currentLocation.longitude,
        allComplaints
      );

      this.priorityScore = AIEngine.calculatePriorityScore(
        this.selectedSeverity,
        this.detectedDuplicates.length,
        true
      );

      this.renderAIResults();
    }, 700);
  },

  renderAIResults() {
    const aiCard = document.getElementById('ai-analysis-card');
    if (!aiCard || !this.aiAnalysis) return;

    const userDescInput = document.getElementById('report-description');
    const userDesc = userDescInput ? userDescInput.value : '';

    const summary = AIEngine.generateSmartSummary(
      this.selectedCategory,
      userDesc,
      this.aiAnalysis,
      this.currentLocation.address
    );

    let duplicateNoticeHtml = '';
    if (this.detectedDuplicates.length > 0) {
      duplicateNoticeHtml = `
        <div class="duplicate-alert-card">
          <div class="duplicate-alert-header">
            <span>⚠️</span>
            <span>Possible Duplicate Complaint Detected</span>
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary);">
            We found ${this.detectedDuplicates.length} similar report(s) within 500 meters of your location:
            <strong>"${this.detectedDuplicates[0].title}"</strong> (${this.detectedDuplicates[0].id}).
          </p>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" onclick="location.hash='#complaint-details?id=${this.detectedDuplicates[0].id}'">
              View Existing Complaint
            </button>
            <span style="font-size: 0.75rem; color: var(--text-muted); align-self: center;">or continue submitting below</span>
          </div>
        </div>
      `;
    }

    aiCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 0.4rem;">
          <span>✨</span> AI Prototype Analysis Output
        </h4>
        <span class="badge badge-verified">92% Confidence</span>
      </div>

      <div class="ai-analysis-results">
        <div class="ai-result-box">
          <div class="ai-result-label">Detected Issue</div>
          <div class="ai-result-value" style="font-size: 0.95rem;">${this.aiAnalysis.detection}</div>
        </div>
        <div class="ai-result-box">
          <div class="ai-result-label">Severity Rating</div>
          <div class="ai-result-value severity-${this.selectedSeverity.toLowerCase()}">${this.selectedSeverity}</div>
        </div>
        <div class="ai-result-box">
          <div class="ai-result-label">AI Priority Score</div>
          <div class="ai-result-value" style="color: #f97316;">${this.priorityScore}/100</div>
        </div>
      </div>

      <div style="margin-top: 1rem; padding: 0.85rem; background-color: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">
          Smart Report AI Summary
        </div>
        <p style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 0.4rem;">
          ${summary.summaryText}
        </p>
        <div style="font-size: 0.8rem; color: #38bdf8; font-weight: 600;">
          Recommended Routing: <span>${summary.recommendedDepartment}</span>
        </div>
      </div>

      ${duplicateNoticeHtml}
    `;
  },

  fetchGPSLocation() {
    const locStatus = document.getElementById('gps-status-text');
    const latInput = document.getElementById('input-latitude');
    const lngInput = document.getElementById('input-longitude');
    const addressInput = document.getElementById('input-address');

    if (locStatus) locStatus.innerText = 'Requesting GPS Location permissions...';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentLocation.latitude = parseFloat(pos.coords.latitude.toFixed(4));
          this.currentLocation.longitude = parseFloat(pos.coords.longitude.toFixed(4));
          
          if (latInput) latInput.value = this.currentLocation.latitude;
          if (lngInput) lngInput.value = this.currentLocation.longitude;
          if (locStatus) {
            locStatus.innerHTML = `<span style="color: #10b981;">✓ GPS Captured: Lat ${this.currentLocation.latitude}, Lng ${this.currentLocation.longitude}</span>`;
          }
          this.runAIScan();
        },
        (err) => {
          if (locStatus) {
            locStatus.innerHTML = `<span style="color: #ef4444;">⚠️ Location permission required for accurate civic reporting. Using default city fallback coordinates.</span>`;
          }
          if (latInput) latInput.value = this.currentLocation.latitude;
          if (lngInput) lngInput.value = this.currentLocation.longitude;
        },
        { timeout: 5000 }
      );
    } else {
      if (locStatus) locStatus.innerText = 'Geolocation API not supported by browser.';
    }
  },

  async submitReport() {
    const descInput = document.getElementById('report-description');
    const addressInput = document.getElementById('input-address');
    const titleInput = document.getElementById('report-title');

    const description = descInput ? descInput.value.trim() : '';
    const address = addressInput ? addressInput.value.trim() : 'Anna Nagar 2nd Avenue, Chennai';
    const title = titleInput && titleInput.value.trim() ? titleInput.value.trim() : `${this.selectedCategory} reported at ${address.split(',')[0]}`;

    if (!description) {
      AppState.showToast('Please enter an issue description.', 'warning');
      return;
    }

    // Generate Unique CT-2026-XXXXXX ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const complaintId = `CT-2026-${randomNum}`;

    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const categoryIcons = {
      'Pothole': '🕳️', 'Streetlight': '💡', 'Garbage': '🗑️',
      'Drainage': '🌊', 'Traffic Signal': '🚦', 'Road Damage': '🛣️',
      'Road Obstruction': '🚧', 'Public Property Damage': '🌳', 'Other': '📋'
    };

    const smartSummary = AIEngine.generateSmartSummary(
      this.selectedCategory,
      description,
      this.aiAnalysis || { severity: this.selectedSeverity, recommendation: 'Inspection required' },
      address
    );

    // Default image fallback if none uploaded
    const finalImage = this.currentImage || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80';

    const newComplaint = {
      id: complaintId,
      category: this.selectedCategory,
      categoryIcon: categoryIcons[this.selectedCategory] || '📋',
      title: title,
      description: description,
      location: {
        address: address,
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        zone: 'Zone 8 - Anna Nagar'
      },
      severity: this.selectedSeverity,
      priorityScore: this.priorityScore,
      status: 'SUBMITTED', // Initial status
      createdAt: timestamp,
      assignedDepartment: smartSummary.recommendedDepartment,
      slaDays: this.selectedSeverity === 'CRITICAL' ? 1 : this.selectedSeverity === 'HIGH' ? 3 : 5,
      slaDueDate: new Date(Date.now() + (this.selectedSeverity === 'HIGH' ? 3 : 5) * 86400000).toISOString(),
      image: finalImage,
      aiAnalysis: {
        detection: `${this.selectedCategory} detected`,
        confidence: 92,
        severity: this.selectedSeverity,
        recommendation: smartSummary.summaryText
      },
      timeline: [
        { status: 'SUBMITTED', label: 'Complaint Submitted', time: formattedTime, icon: '📝', by: 'Citizen (You)' },
        { status: 'AI_VERIFIED', label: 'AI Prototype Verified & Severity Scored', time: formattedTime, icon: '✨', by: 'CivicTrack AI Engine' }
      ],
      citizenVerification: {
        promptActive: false,
        status: 'PENDING',
        notes: ''
      }
    };

    await API.createComplaint(newComplaint);

    AppState.showToast(`Complaint ${complaintId} submitted successfully!`, 'success');

    // Reset form
    if (descInput) descInput.value = '';
    if (titleInput) titleInput.value = '';

    // Navigate to Complaint Details timeline page for the new complaint
    location.hash = `#complaint-details?id=${complaintId}`;
  }
};
