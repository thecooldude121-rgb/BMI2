# Lead Generation Platform - Chrome Extension

LinkedIn Prospecting Chrome Extension for enriching profiles, adding prospects to sequences, and syncing with the lead generation platform.

## Features

- **Profile Enrichment**: Automatically enrich LinkedIn profiles with email, phone, company data, and intent scores
- **Quick Actions**: Add prospects to sequences, save to lists, and send messages directly from LinkedIn
- **AI Talking Points**: Get AI-recommended talking points based on prospect's profile
- **Message Templates**: Access one-click LinkedIn message templates
- **Real-time Sync**: Bi-directional sync with the platform every 15 minutes
- **Status Indicators**: See if a prospect is already in your database

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` directory

### Production Build

1. Create icons (16x16, 48x48, 128x128 PNG files) and place in `icons/` directory
2. Test all functionality on LinkedIn profiles
3. Package the extension as a `.zip` file
4. Submit to Chrome Web Store

## Configuration

### API Endpoint

Update the `PLATFORM_API` constant in `background.js` and `content.js` to point to your platform API:

```javascript
const PLATFORM_API = 'https://your-api-domain.com';
```

### Authentication

The extension uses OAuth-style token authentication:

1. User signs in via popup
2. Extension receives session token
3. Token is stored in `chrome.storage.local`
4. Token is sent with all API requests

## API Endpoints Required

Your platform must provide these endpoints:

### POST `/api/extension/auth`
Authenticate user and receive session token
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "token": "session-token",
  "userId": "user-id",
  "email": "user@example.com"
}
```

### POST `/api/enrich/linkedin`
Enrich LinkedIn profile data
```json
{
  "name": "John Doe",
  "headline": "CEO at Company",
  "profileUrl": "https://linkedin.com/in/johndoe",
  "linkedinId": "johndoe"
}
```

Response:
```json
{
  "inDatabase": true,
  "email": "john@company.com",
  "phone": "+1234567890",
  "company": {
    "name": "Company Inc",
    "size": "100-500"
  },
  "intentScore": 85,
  "talkingPoints": [
    "Recently visited pricing page",
    "Company just raised Series B"
  ],
  "templates": [
    {
      "name": "Introduction",
      "content": "Hi {{name}}, I noticed..."
    }
  ]
}
```

### GET `/api/extension/sync`
Sync data for extension
```
Headers: Authorization: Bearer {token}
```

Response:
```json
{
  "prospectsCount": 1247,
  "sequencesCount": 8,
  "templates": [...],
  "lists": [...]
}
```

## File Structure

```
chrome-extension/
├── manifest.json          # Extension manifest (v3)
├── background.js          # Service worker for background tasks
├── content.js             # Content script injected into LinkedIn
├── content.css            # Styles for injected UI
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and authentication
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Permissions

The extension requires these permissions:

- `activeTab`: Access current tab to inject content script
- `storage`: Store session data locally
- `scripting`: Inject scripts into LinkedIn pages
- `https://www.linkedin.com/*`: Access LinkedIn profiles

## Privacy & Security

- No data is collected without user authentication
- Session tokens are stored locally and never shared
- All API communication uses HTTPS
- Users can sign out to revoke access at any time

## Testing

1. Test authentication flow
2. Navigate to a LinkedIn profile page
3. Verify side panel appears and displays enrichment data
4. Test all quick action buttons
5. Verify real-time sync works
6. Test message template functionality

## Known Limitations

- Only works on LinkedIn.com
- Requires user to be signed into LinkedIn
- Rate limited by LinkedIn's DOM structure changes
- Sync requires internet connection

## Support

For issues or feature requests, contact: support@your-platform.com
