// LinkedIn Profile Enrichment - Content Script
// This script runs on LinkedIn profile pages and injects enrichment data

class LinkedInProspector {
  constructor() {
    this.platformAPI = 'https://your-platform-api.com';
    this.sessionToken = null;
    this.init();
  }

  async init() {
    // Get session token from storage
    const { sessionToken } = await chrome.storage.local.get(['sessionToken']);
    this.sessionToken = sessionToken;

    if (!this.sessionToken) {
      console.log('Not authenticated with platform');
      return;
    }

    // Wait for LinkedIn profile to load
    this.waitForProfile();
  }

  waitForProfile() {
    const checkInterval = setInterval(() => {
      const profileName = document.querySelector('.pv-text-details__left-panel h1');
      if (profileName) {
        clearInterval(checkInterval);
        this.injectSidePanel();
        this.extractProfileData();
      }
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  extractProfileData() {
    const profileData = {
      name: document.querySelector('.pv-text-details__left-panel h1')?.textContent?.trim(),
      headline: document.querySelector('.pv-text-details__left-panel .text-body-medium')?.textContent?.trim(),
      location: document.querySelector('.pv-text-details__left-panel .text-body-small')?.textContent?.trim(),
      company: document.querySelector('.pv-text-details__right-panel li')?.textContent?.trim(),
      profileUrl: window.location.href,
      linkedinId: this.getLinkedInId()
    };

    console.log('Extracted profile data:', profileData);
    this.enrichProfile(profileData);
  }

  getLinkedInId() {
    const urlMatch = window.location.href.match(/\/in\/([^/]+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  async enrichProfile(profileData) {
    try {
      const response = await fetch(`${this.platformAPI}/api/enrich/linkedin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const enrichedData = await response.json();
        this.updateSidePanel(enrichedData);
      }
    } catch (error) {
      console.error('Error enriching profile:', error);
    }
  }

  injectSidePanel() {
    // Check if panel already exists
    if (document.getElementById('lgp-side-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'lgp-side-panel';
    panel.className = 'lgp-panel';
    panel.innerHTML = `
      <div class="lgp-panel-header">
        <div class="lgp-logo">🎯</div>
        <h3>Lead Gen Platform</h3>
        <button class="lgp-close" onclick="this.closest('.lgp-panel').remove()">×</button>
      </div>
      <div class="lgp-panel-content">
        <div class="lgp-loading">
          <div class="lgp-spinner"></div>
          <p>Enriching profile...</p>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
  }

  updateSidePanel(data) {
    const panel = document.getElementById('lgp-side-panel');
    if (!panel) return;

    const content = panel.querySelector('.lgp-panel-content');
    content.innerHTML = `
      <div class="lgp-section">
        <div class="lgp-status ${data.inDatabase ? 'lgp-status-exists' : 'lgp-status-new'}">
          ${data.inDatabase ? '✓ In Database' : '+ New Prospect'}
        </div>
      </div>

      ${data.email || data.phone ? `
        <div class="lgp-section">
          <h4 class="lgp-section-title">Contact Info</h4>
          ${data.email ? `
            <div class="lgp-field">
              <span class="lgp-icon">✉️</span>
              <a href="mailto:${data.email}">${data.email}</a>
            </div>
          ` : ''}
          ${data.phone ? `
            <div class="lgp-field">
              <span class="lgp-icon">📞</span>
              <a href="tel:${data.phone}">${data.phone}</a>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${data.company ? `
        <div class="lgp-section">
          <h4 class="lgp-section-title">Company</h4>
          <div class="lgp-field">
            <span class="lgp-icon">🏢</span>
            <span>${data.company.name}</span>
          </div>
          ${data.company.size ? `
            <div class="lgp-field-sm">
              <span>Size: ${data.company.size}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${data.intentScore ? `
        <div class="lgp-section">
          <h4 class="lgp-section-title">Intent Score</h4>
          <div class="lgp-score-bar">
            <div class="lgp-score-fill" style="width: ${data.intentScore}%"></div>
          </div>
          <p class="lgp-score-label">${data.intentScore}/100</p>
        </div>
      ` : ''}

      ${data.talkingPoints?.length ? `
        <div class="lgp-section">
          <h4 class="lgp-section-title">AI Talking Points</h4>
          ${data.talkingPoints.map(point => `
            <div class="lgp-talking-point">💡 ${point}</div>
          `).join('')}
        </div>
      ` : ''}

      <div class="lgp-actions">
        <button class="lgp-btn lgp-btn-primary" onclick="lgpAddToSequence()">
          ➕ Add to Sequence
        </button>
        <button class="lgp-btn lgp-btn-secondary" onclick="lgpSaveToList()">
          💾 Save to List
        </button>
        <button class="lgp-btn lgp-btn-secondary" onclick="lgpSendMessage()">
          ✉️ Quick Message
        </button>
      </div>

      ${data.templates?.length ? `
        <div class="lgp-section">
          <h4 class="lgp-section-title">Message Templates</h4>
          ${data.templates.slice(0, 3).map((template, idx) => `
            <button class="lgp-template" onclick="lgpUseTemplate(${idx})">
              ${template.name}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;
  }
}

// Initialize the prospector
const prospector = new LinkedInProspector();

// Global functions for action buttons
window.lgpAddToSequence = function() {
  chrome.runtime.sendMessage({ action: 'add_to_sequence' });
};

window.lgpSaveToList = function() {
  chrome.runtime.sendMessage({ action: 'save_to_list' });
};

window.lgpSendMessage = function() {
  chrome.runtime.sendMessage({ action: 'send_message' });
};

window.lgpUseTemplate = function(index) {
  chrome.runtime.sendMessage({ action: 'use_template', templateIndex: index });
};
