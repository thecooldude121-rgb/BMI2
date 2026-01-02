// Popup script for Chrome Extension

const loginView = document.getElementById('login-view');
const connectedView = document.getElementById('connected-view');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const logoutButton = document.getElementById('logout-button');
const syncButton = document.getElementById('sync-button');
const openDashboardButton = document.getElementById('open-dashboard');

// Check authentication status on load
checkAuthStatus();

async function checkAuthStatus() {
  const { sessionToken, userEmail } = await chrome.storage.local.get(['sessionToken', 'userEmail']);

  if (sessionToken) {
    showConnectedView(userEmail);
    loadStats();
  } else {
    showLoginView();
  }
}

function showLoginView() {
  loginView.classList.remove('hidden');
  connectedView.classList.add('hidden');
}

function showConnectedView(email) {
  loginView.classList.add('hidden');
  connectedView.classList.remove('hidden');
  document.getElementById('user-email').textContent = email;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');

  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 5000);
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.textContent = 'Signing in...';
  submitButton.disabled = true;

  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: 'authenticate',
          credentials: { email, password }
        },
        response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response.success) {
      await chrome.storage.local.set({ userEmail: email });
      showConnectedView(email);
      loadStats();
    } else {
      showError(response.error || 'Authentication failed');
    }
  } catch (error) {
    showError(error.message || 'Connection error');
  } finally {
    submitButton.textContent = 'Sign In';
    submitButton.disabled = false;
  }
});

// Handle logout
logoutButton.addEventListener('click', async () => {
  await chrome.storage.local.clear();
  showLoginView();
});

// Handle sync
syncButton.addEventListener('click', async () => {
  syncButton.textContent = '🔄 Syncing...';
  syncButton.disabled = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate sync
    await loadStats();
  } finally {
    syncButton.textContent = '🔄 Sync Data';
    syncButton.disabled = false;
  }
});

// Open dashboard
openDashboardButton.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://your-platform-api.com/dashboard' });
});

// Load and display stats
async function loadStats() {
  const { syncData } = await chrome.storage.local.get(['syncData']);

  if (syncData) {
    document.getElementById('prospects-count').textContent =
      syncData.prospectsCount || '0';
    document.getElementById('sequences-count').textContent =
      syncData.sequencesCount || '0';
  }
}
