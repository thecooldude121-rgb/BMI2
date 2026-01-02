# Meeting Detail Page - Data Mapping Guide

**Meeting ID**: `meeting_acme_001`
**Path**: `/crm/meetings/meeting_acme_001`

This document maps every piece of mock data to its exact location in the UI.

---

## Hero Header Section

### Basic Meeting Info
| Mock Data | UI Location | Component |
|-----------|-------------|-----------|
| `title: "Acme Corp - Proposal Review"` | Page title (3xl font) | Hero header |
| `type: "video"` | Icon + label "Video Call" | Hero header |
| `startTime: "2024-12-07T10:00:00"` | "Dec 7, 2024 • 10:00 AM" | Hero header |
| `endTime: "2024-12-07T10:45:00"` | "10:45 AM" | Hero header |
| `duration: 45` | "Duration: 45 minutes" | Hero header |
| `status: "completed"` | Green badge "✅ Completed" | Hero header |
| `aiProcessingStatus: "processed"` | Purple badge "🤖 AI Processed" | Hero header |

### Attendees Display
| Mock Data | UI Location |
|-----------|-------------|
| `attendees[0].name: "John Smith"` | "👥 Attendees: John Smith (VP Sales)" |
| `attendees[0].title: "VP Sales"` | Shown in parentheses |
| `attendees[1].name: "Alex Rodriguez"` | "You" |

### Deal Info
| Mock Data | UI Location |
|-----------|-------------|
| `dealTitle: "Acme Corp - Enterprise Plan"` | "📊 Deal: Acme Corp - $50K" |
| `dealValue: 50000` | "$50K" |
| `dealStage: "Proposal"` | "(Proposal)" |

### Account Info
| Mock Data | UI Location |
|-----------|-------------|
| `accountName: "Acme Corp"` | "🏢 Account: Acme Corp" |

---

## AI Meeting Intelligence Panel (PURPLE GRADIENT)

### Meeting Summary
| Mock Data | UI Location |
|-----------|-------------|
| `aiSummary.summary` | Full paragraph under "━━━ Meeting Summary ━━━" |
| Full text | "Budget confirmed at $50,000 annually. Timeline discussed: Q1 2026..." |

### Key Points Discussed (Hardcoded with Rich Details)
**Note**: The UI shows 4 detailed key points with timestamps and impacts. The base data comes from `aiSummary.keyPoints`, but the UI adds rich details:

| Display | Based On | Enhanced UI |
|---------|----------|-------------|
| 💰 Budget Confirmed | `keyPoints[0]` | + Timeline: 05:30 - 08:15<br>+ Impact: ✅ Deal amount updated |
| 📅 Implementation Timeline | `keyPoints[1]` | + Timeline: 15:45 - 18:20<br>+ Impact: ✅ Deal close date updated |
| 🔌 Integration Requirements | `keyPoints[2]` | + Timeline: 22:10 - 28:45<br>+ Impact: ⚠️ Technical review needed |
| 👔 Decision Process | `keyPoints[3]` | + Timeline: 35:20 - 37:10<br>+ Impact: 📋 Task created |

### Sentiment Analysis

#### Overall Sentiment
| Mock Data | UI Location |
|-----------|-------------|
| `aiSummary.sentiment: "positive"` | "😊 Positive" emoji + label |
| `aiSummary.sentimentScore: 85` | "85% confidence" + progress bar at 85% |

#### Sentiment Timeline (Hardcoded)
| Time Range | Sentiment | Score | UI Display |
|------------|-----------|-------|------------|
| 00:00 - 10:00 | Positive | 90% | Green bar at 90% |
| 10:01 - 25:00 | Positive | 85% | Green bar at 85% |
| 25:01 - 35:00 | Neutral | 60% | Yellow bar at 60% + note |
| 35:01 - 45:00 | Positive | 88% | Green bar at 88% |

#### Key Moments (Hardcoded)
| Time | Event | UI Display |
|------|-------|------------|
| 06:20 | Positive pricing response | ✅ Very positive response to pricing (06:20) |
| 12:45 | Excited about features | ✅ Excited about automation features (12:45) |
| 27:30 | Concerns | ⚠️ Concerns about complexity (27:30) |
| 42:15 | Agreement | ✅ Agreement on next steps (42:15) |

### Action Items
| Mock Data | UI Display |
|-----------|------------|
| `actionItems[0].id` | Checkbox ID |
| `actionItems[0].description: "Send updated proposal"` | "1. Send updated proposal" |
| `actionItems[0].assignee: "Alex Rodriguez"` | "Assigned: Alex Rodriguez" |
| `actionItems[0].dueDate: "2024-12-10"` | "Due: Dec 10, 2024" |
| `actionItems[0].completed: true` | "Status: ✅ Completed (Dec 8)" + strikethrough |
| `actionItems[1].completed: false` | "Status: ⏳ In Progress" |
| `actionItems[2].completed: false` | "Status: ⏳ Pending" |
| `actionItems[3].completed: false` | "Status: ⏳ Pending" |

**Timestamp mentions (Hardcoded)**:
- Action 1: Mentioned at 40:25
- Action 2: Mentioned at 28:45
- Action 3: Mentioned at 36:50
- Action 4: Mentioned at 41:10

### CRM Auto-Updates (Hardcoded)
6 items shown with green checkmarks:
1. Deal amount: Confirmed at $50,000
2. Deal close date: Updated to March 15, 2026
3. Deal stage: Proposal → Proposal (No change)
4. 4 tasks created automatically
5. Competitor noted: Salesforce
6. Decision maker identified: CEO (needs intro)

### Talking Points for Next Meeting
Based on `aiSummary.nextSteps` but enhanced:

| Data | UI Display |
|------|------------|
| `nextSteps[0]` | 🎯 1. Salesforce Integration Capabilities<br>Why: Main concern from John (mentioned 3x)<br>Suggested: Show demo of API integration |
| `nextSteps[1]` | 🎯 2. ROI Calculation for 75-person team<br>Why: John asked about cost justification<br>Suggested: Prepare case study |
| `nextSteps[2]` | 🎯 3. Implementation Timeline Details<br>Why: Concern about 6-month duration<br>Suggested: Break down into phases |
| `nextSteps[3]` | 🎯 4. Customer Success Stories (SaaS sector)<br>Why: Wants proof<br>Suggested: Share DataFlow case study |

---

## Recording Player

| Mock Data | UI Display |
|-----------|------------|
| `hasRecording: true` | Player visible |
| `recordingDuration: 45` | Progress bar: "00:00 ━━━━━━○ 45:00" |
| `recordingUrl` | Used for play action |

### Key Moments (Jump Points)
Hardcoded 5 clickable moments:
- 05:30 💰 Budget discussion
- 15:45 📅 Timeline review
- 22:10 🔌 Integration concerns
- 35:20 👔 CEO approval mentioned
- 40:00 ✅ Next steps agreed

---

## Attendees Section

### John Smith (Customer)
| Mock Data | UI Display |
|-----------|------------|
| `attendees[0].name` | "John Smith" in bold |
| `attendees[0].title` | "VP Sales at Acme Corp" |
| `attendees[0].email` | "📧 john@acme.com" |
| `accountName` | "at Acme Corp" |
| Hardcoded | "💼 Role: Customer/Champion" |
| Hardcoded | "🤖 Speaking time: 22 mins (49%)" |
| Hardcoded | "😊 Sentiment: Positive (85%)" |
| Hardcoded | "💬 Key topics: Budget, Timeline, CEO" |

### Alex Rodriguez (You)
| Mock Data | UI Display |
|-----------|------------|
| `attendees[1].name` | "Alex Rodriguez (You)" |
| `attendees[1].title` | "Sales Rep at BMI CRM" |
| `attendees[1].isHost: true` | "(You)" label + Host role |
| Hardcoded | "💼 Role: Host/Sales Rep" |
| Hardcoded | "🤖 Speaking time: 23 mins (51%)" |
| Hardcoded | "😊 Sentiment: Positive (88%)" |
| Hardcoded | "💬 Key topics: Features, Pricing, Demo" |

---

## Meeting Notes

**Hardcoded 2 notes**:

Note 1:
- Date: Dec 7, 2024
- Author: Alex Rodriguez
- Content: "John seemed very interested but emphasized need for CEO approval. Should focus on ROI and ease of integration in follow-up materials."

Note 2:
- Date: Dec 7, 2024
- Author: Sarah Chen
- Content: From `notes` field

---

## Right Sidebar - Meeting Details

### Basic Info Grid
| Mock Data | UI Label | UI Value |
|-----------|----------|----------|
| `type` | TYPE | "Video Call" |
| `status` | STATUS | "✅ Completed" |
| `startTime` | DATE | "Dec 7, 2024" |
| `duration` | DURATION | "45 minutes" |
| `startTime + endTime` | TIME | "10:00 - 10:45 AM" |
| Hardcoded | PLATFORM | "Zoom" |

### Extended Info
| Mock Data | UI Display |
|-----------|------------|
| `hasRecording: true` | "✅ Available (45 mins, 125 MB)" |
| `recordingDuration: 45` | "45 mins" in recording status |
| `hasTranscript: true` | "✅ Available (3,245 words)" |
| `aiProcessingStatus: "processed"` | "✅ Completed (Dec 7, 11:30 AM)" |
| `attendees[1].name` | "Created By: Alex Rodriguez" |
| `updatedAt` | "Last Modified: Dec 7, 2024 11:32 AM" |

---

## Right Sidebar - Linked Records

### Deal Card
| Mock Data | UI Display |
|-----------|------------|
| `dealTitle` | "Acme Corp - Enterprise Plan" |
| `dealValue` | "$50,000" |
| `dealStage` | "Proposal Stage" |
| Hardcoded | "Close: March 15, 2026" |
| Hardcoded | "🤖 AI Health: 78/100" |
| Hardcoded | "Win Probability: 67%" |
| `dealId` | Used in "View Deal Details" link |

### Account Card
| Mock Data | UI Display |
|-----------|------------|
| `accountName` | "Acme Corp" |
| Hardcoded | "Industry: SaaS, Project Management" |
| Hardcoded | "Size: 75 employees" |
| Hardcoded | "Revenue: $12M annually" |
| `accountId` | Used in "View Account Details" link |

### Primary Contact Card
| Mock Data | UI Display |
|-----------|------------|
| `attendees[0].name` | "John Smith" |
| `attendees[0].title` | "VP Sales" |
| `attendees[0].email` | "📧 john@acme.com" |
| Hardcoded | "📞 +1 555-0123" |
| Hardcoded | "Last contact: This meeting (Today)" |
| Hardcoded | "Engagement: 92% response rate" |
| `attendees[0].id` | Used in "View Contact Details" link |

---

## Right Sidebar - Related Documents

### Document 1: Meeting Transcript
| Mock Data | UI Display |
|-----------|------------|
| `hasTranscript: true` | Document visible |
| `transcriptUrl` | Used for view/download |
| Hardcoded | "📝 Meeting Transcript" |
| Hardcoded | "Acme_Meeting_Transcript.pdf" |
| Hardcoded | "245 KB • Auto-generated" |

### Document 2: Meeting Recording
| Mock Data | UI Display |
|-----------|------------|
| `hasRecording: true` | Document visible |
| `recordingUrl` | Used for play/download |
| `recordingDuration` | "45 minutes" |
| Hardcoded | "🎥 Meeting Recording" |
| Hardcoded | "Acme_Meeting_Recording.mp4" |
| Hardcoded | "125 MB" |

### Document 3: Proposal
Hardcoded:
- "📄 Acme Corp Proposal v2"
- "Acme_Proposal_v2.pdf"
- "2.4 MB • Discussed in meeting"

---

## Right Sidebar - Meeting Score

### Overall Score (Hardcoded)
| Value | UI Display |
|-------|------------|
| 85 | "85/100" large text |
| Progress | Green bar at 85% |
| Label | "Excellent" |

### Score Breakdown (Hardcoded)
- Engagement: 92/100 ⭐⭐⭐⭐⭐
- Sentiment: 85/100 ⭐⭐⭐⭐⭐
- Outcome: 80/100 ⭐⭐⭐⭐
- Next Steps: 88/100 ⭐⭐⭐⭐⭐

### Why This Score (Hardcoded)
- Both parties highly engaged
- Clear budget confirmation (+20)
- Positive sentiment throughout (+15)
- Concrete next steps defined (+18)
- Some concerns about complexity (-8)
- CEO approval adds uncertainty (-7)

---

## Right Sidebar - Impact on Deal

### Metrics (Hardcoded)
| Metric | Before | After | Change | UI Display |
|--------|--------|-------|--------|------------|
| Win Probability | 65% | 67% | +2% | "Before: 65% ━━> After: 67% (+2%)" |
| Deal Health | 76 | 78 | +2 | "Before: 76/100 ━━> After: 78/100 (+2)" |

### Predictions (Hardcoded)
- Next Meeting Likelihood: 95%
- Predicted Close Date: March 12, 2026
- Note: (3 days earlier than target)

### AI Recommendation (Hardcoded)
"Focus on technical demo addressing Salesforce integration to increase win probability to 75%+"

---

## Right Sidebar - Quick Actions

5 action buttons (all functional):
1. 📧 Email Attendees
2. 🗓️ Schedule Follow-up
3. 📤 Share Recording
4. 📊 Add to Report
5. 📥 Export Summary

---

## Data Sources Summary

### From Mock Data Object
**Direct mappings** (shown as-is):
- ✅ Meeting ID, title, type, status
- ✅ Start time, end time, duration
- ✅ Attendees (names, titles, emails)
- ✅ Deal info (title, value, stage, ID)
- ✅ Account info (name, ID)
- ✅ AI summary text
- ✅ Key points (4 items)
- ✅ Overall sentiment + score
- ✅ Action items (4 items with all fields)
- ✅ Next steps (used for talking points)
- ✅ Recording/transcript status
- ✅ Created/updated timestamps

### Enhanced by UI
**Hardcoded enhancements** (added in component):
- ✅ Key point timelines (05:30 - 08:15, etc.)
- ✅ Key point impacts with emojis
- ✅ Sentiment timeline (4 segments with scores)
- ✅ Key moments (5 timestamps)
- ✅ Action item "mentioned at" timestamps
- ✅ CRM auto-updates section (6 items)
- ✅ Talking point details (why/suggested)
- ✅ Attendee speaking time analytics
- ✅ Attendee sentiment percentages
- ✅ Attendee key topics
- ✅ Meeting score breakdown (85/100)
- ✅ Impact metrics (win probability changes)
- ✅ Document names and sizes
- ✅ Contact phone numbers
- ✅ Account details (industry, size, revenue)

### State Management
**Interactive elements**:
- ✅ `actionItems` state - Toggles completion
- ✅ `showRecordingPlayer` state - Opens/closes player
- ✅ `currentTime` state - Video playback position
- ✅ `isPlaying` state - Play/pause status

---

## Navigation Mapping

### Clickable Links
| UI Element | Target Route | Data Used |
|------------|-------------|-----------|
| Breadcrumb "Meetings" | `/crm/meetings` | None |
| Attendee "John Smith" | `/crm/contacts/contact_john_smith` | `attendees[0].id` |
| Deal link | `/crm/deals/deal-acme` | `dealId` |
| Account link | `/crm/accounts/acc-acme` | `accountId` |
| "View Deal Details" | `/crm/deals/deal-acme` | `dealId` |
| "View Account Details" | `/crm/accounts/acc-acme` | `accountId` |
| "View Contact Details" | `/crm/contacts/contact_john_smith` | `attendees[0].id` |

---

## Color Coding

### AI Intelligence Panel
- Background: Purple-to-blue gradient (#667eea → #3b82f6)
- Border: Purple (#d4b5ff)
- Badges: Purple background, white text

### Sentiment Colors
| Sentiment | Background | Text | Progress Bar |
|-----------|-----------|------|--------------|
| Positive | #d1fae5 | #047857 | Green |
| Neutral | #fef3c7 | #92400e | Yellow |
| Negative | #fee2e2 | #991b1b | Red |

### Impact Types
| Type | Color | Emoji |
|------|-------|-------|
| Success | Green (#10b981) | ✅ |
| Warning | Amber (#f59e0b) | ⚠️ |
| Info | Blue (#3b82f6) | 📋 |

---

## Verification Checklist

Use this to verify all data is displaying correctly:

### Hero Section ✅
- [ ] Title: "Acme Corp - Proposal Review"
- [ ] Two badges: Green "Completed" + Purple "AI Processed"
- [ ] Date/time: "Dec 7, 2024 • 10:00 AM - 10:45 AM"
- [ ] Duration: "45 minutes"
- [ ] Attendees: "John Smith (VP Sales), You"
- [ ] Deal: "$50K (Proposal)"
- [ ] Account: "Acme Corp"

### AI Panel ✅
- [ ] Summary paragraph visible
- [ ] 4 key points with emojis
- [ ] Each key point has timeline
- [ ] Each key point has impact
- [ ] Overall sentiment: 85%
- [ ] 4 sentiment timeline segments
- [ ] 4 key moments listed
- [ ] 4 action items with checkboxes
- [ ] Action item #1 shows completed (strikethrough)
- [ ] 6 CRM auto-updates
- [ ] 4 talking points

### Recording ✅
- [ ] Video player visible
- [ ] Progress bar: 00:00 to 45:00
- [ ] 5 key moments clickable

### Attendees ✅
- [ ] 2 attendee cards
- [ ] John Smith card complete
- [ ] Speaking times: 22 mins, 23 mins
- [ ] Sentiments: 85%, 88%

### Sidebar ✅
- [ ] Meeting details grid (6 rows)
- [ ] Deal card with AI health
- [ ] Account card with details
- [ ] Contact card with engagement
- [ ] 3 document cards
- [ ] Meeting score: 85/100
- [ ] Impact metrics showing changes
- [ ] 5 quick action buttons

---

## Testing Commands

```bash
# Build the project
npm run build

# Navigate to meeting detail
Open: /crm/meetings/meeting_acme_001

# Verify navigation
Click: "John Smith" → Should go to contact
Click: "Acme Corp" deal → Should go to deal detail
Click: "Acme Corp" account → Should go to account

# Test interactions
Click: Action item checkbox → Should toggle
Click: "Play Recording" → Player should appear
Click: Key moment timestamp → Time should jump
```

---

## Summary

**Total Data Points**: 100+ pieces of information
**Direct from Mock Data**: ~35 fields
**Enhanced by UI**: ~65 elements
**Interactive Elements**: 15+ clickable items
**Navigation Links**: 7 routes

**Status**: All mock data properly mapped and displayed ✅

---

*Last updated: December 21, 2025*
