// Background Service Worker for Chrome Extension

const PLATFORM_API = 'https://your-platform-api.com';

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Lead Generation Platform Extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'add_to_sequence':
      handleAddToSequence(sender.tab);
      break;
    case 'save_to_list':
      handleSaveToList(sender.tab);
      break;
    case 'send_message':
      handleSendMessage(sender.tab);
      break;
    case 'use_template':
      handleUseTemplate(sender.tab, request.templateIndex);
      break;
    case 'authenticate':
      handleAuthentication(request.credentials, sendResponse);
      return true; // Keep channel open for async response
  }
});

// Sync session with platform
async function syncWithPlatform() {
  try {
    const { sessionToken } = await chrome.storage.local.get(['sessionToken']);

    if (!sessionToken) {
      console.log('No session token found');
      return;
    }

    const response = await fetch(`${PLATFORM_API}/api/extension/sync`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      await chrome.storage.local.set({ syncData: data });
      console.log('Synced with platform');
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Handle adding prospect to sequence
async function handleAddToSequence(tab) {
  const { sessionToken } = await chrome.storage.local.get(['sessionToken']);

  if (!sessionToken) {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    return;
  }

  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Adding to Sequence',
    message: 'Opening sequence selector...'
  });

  // Open platform in new tab to sequence page
  chrome.tabs.create({
    url: `${PLATFORM_API}/lead-generation/sequences?action=add`
  });
}

// Handle saving to list
async function handleSaveToList(tab) {
  const { sessionToken } = await chrome.storage.local.get(['sessionToken']);

  if (!sessionToken) {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    return;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Saved to List',
    message: 'Prospect added to your list successfully'
  });
}

// Handle sending message
async function handleSendMessage(tab) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Message Composer',
    message: 'Opening LinkedIn message composer...'
  });

  // Focus on LinkedIn message button
  chrome.tabs.sendMessage(tab.id, { action: 'focus_message' });
}

// Handle using template
async function handleUseTemplate(tab, templateIndex) {
  const { templates } = await chrome.storage.local.get(['templates']);

  if (templates && templates[templateIndex]) {
    const template = templates[templateIndex];

    // Send template to content script to fill in message box
    chrome.tabs.sendMessage(tab.id, {
      action: 'fill_template',
      content: template.content
    });
  }
}

// Handle authentication with platform
async function handleAuthentication(credentials, sendResponse) {
  try {
    const response = await fetch(`${PLATFORM_API}/api/extension/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (response.ok) {
      const data = await response.json();
      await chrome.storage.local.set({
        sessionToken: data.token,
        userId: data.userId,
        userEmail: data.email
      });

      sendResponse({ success: true });

      // Start syncing
      syncWithPlatform();

      // Set up periodic sync
      chrome.alarms.create('sync', { periodInMinutes: 15 });
    } else {
      sendResponse({ success: false, error: 'Authentication failed' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle periodic sync
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync') {
    syncWithPlatform();
  }
});

// Context menu for quick actions
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'lgp-add-prospect',
    title: 'Add to Lead Gen Platform',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lgp-add-prospect' && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'quick_add',
      text: info.selectionText
    });
  }
});
