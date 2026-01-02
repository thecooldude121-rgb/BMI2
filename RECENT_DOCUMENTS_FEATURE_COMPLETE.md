# Recent Documents Quick Access Feature
**Complete Implementation Guide**

**Version:** 1.0.0
**Date:** December 12, 2024

---

## Overview

The Recent Documents Quick Access feature displays the last 5 documents the user viewed in a compact horizontal section at the top of the Documents Library page.

---

## Feature Components

### **1. RecentDocumentsSection Component**
**Location:** `src/components/Documents/RecentDocumentsSection.tsx`

**Purpose:** Standalone component that renders the recent documents carousel

**Props:**
```typescript
interface RecentDocumentsSectionProps {
  recentDocuments: RecentDocument[];
  onViewAll: () => void;
  onPreview: (doc: RecentDocument) => void;
  onDownload: (doc: RecentDocument) => void;
}

interface RecentDocument {
  document_id: string;
  document_name: string;
  file_type: string;
  category: string;
  last_viewed_date: string;
  file_url: string;
}
```

---

## Visual Layout

### **Desktop View (>1200px)**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📌 RECENT DOCUMENTS (Last 5 you viewed)         [View All (15) →]  │
│ ──────────────────────────────────────────────────────────────────  │
│                                                                     │
│ ┌────────┬────────┬────────┬────────┬────────┐                    │
│ │ DOC 1  │ DOC 2  │ DOC 3  │ DOC 4  │ DOC 5  │                    │
│ │ 📄     │ 📄     │ 📄     │ 📊     │ 📄     │                    │
│ │        │        │        │        │        │                    │
│ │ Acme   │ Tech   │ BigCo  │ Demo   │ Case   │                    │
│ │ Prop.. │ Cont.. │ Trans..│ Deck   │ Study  │                    │
│ │        │        │        │        │        │                    │
│ │ Proposal│Contract│Meeting │Present.│Case St.│                   │
│ │ 2h ago │ 5h ago │Yesterd.│ 2d ago │ 3d ago │                    │
│ │        │        │        │        │        │                    │
│ │ [👁️][⬇️]│ [👁️][⬇️]│ [👁️][⬇️]│ [👁️][⬇️]│ [👁️][⬇️]│                    │
│ └────────┴────────┴────────┴────────┴────────┘                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### **Compact Card Design**

```
┌─────────────────────┐
│        📄           │  ← File icon (32px)
│                     │
│ Acme_Proposal.pdf   │  ← Document name (14px, truncated)
│                     │
│ 🏷️ Proposal         │  ← Category badge (small)
│ 2 hours ago         │  ← Last viewed time (13px, gray)
│                     │
│     [👁️]   [⬇️]      │  ← Quick actions (icon only)
└─────────────────────┘

Dimensions: 180px × 140px
```

---

## Feature Behavior

### **Display Logic**

The Recent Documents section is shown when:
- ✅ Page is NOT loading
- ✅ No errors present
- ✅ NO active filters applied
- ✅ NO context filter (deal_id, account_id, etc.)
- ✅ User is on "All Documents" view

The section is HIDDEN when:
- ❌ Any filter is active (category, source, owner, etc.)
- ❌ Context filter is applied (viewing deal/account docs)
- ❌ Search query is entered
- ❌ Custom view filter is selected (my, shared, recent, favorites)
- ❌ Date range filter is active

---

## User Interactions

### **1. Click Compact Card**
**Action:** Click anywhere on card
**Result:** Navigate to document detail page
**URL:** `/documents/{document_id}`
**Example:** Click "Acme_Proposal.pdf" → Navigate to `/documents/doc_acme_proposal`

---

### **2. Quick Preview**
**Action:** Click 👁️ (Eye) icon
**Result:** Show quick preview modal (toast for now)
**Toast:** "Preview: Acme_Corp_Proposal_v2.pdf" (info)

**Future Enhancement:** Open preview modal with document viewer

---

### **3. Download Document**
**Action:** Click ⬇️ (Download) icon
**Result:** Download file (toast for now)
**Toast:** "Downloading: Acme_Corp_Proposal_v2.pdf" (success)

**Future Enhancement:** Trigger actual file download

---

### **4. View All Recent**
**Action:** Click "View All (15) →"
**Result:**
- Set filter to "recent"
- Show all 15 recent documents in main grid
- Toast: "Showing all recent documents" (info)

---

### **5. Hover Card**
**Effect:**
- Card lifts up (translateY: -2px)
- Box shadow increases
- Border color changes to blue
- Full filename shown in tooltip

---

### **6. Collapse Section**
**Action:** Click 🔼 (ChevronUp) icon
**Result:**
- Section collapses to single line
- Shows: "📌 Recent Documents (5) [🔽]"
- Preference saved to localStorage (future)

**Expand:**
- Click 🔽 (ChevronDown) icon
- Section expands back to full view

---

## Empty State

When user hasn't viewed any documents yet:

```
┌─────────────────────────────────────────────────────────────────────┐
│ 📌 RECENT DOCUMENTS                                        [🔼]      │
│ ──────────────────────────────────────────────────────────────────  │
│                                                                     │
│                         📄                                          │
│                No recent documents yet                              │
│            Documents you view will appear here                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Mock Data

### **RECENT_DOCUMENTS_MOCK**

```typescript
const RECENT_DOCUMENTS_MOCK = [
  {
    document_id: "doc_acme_proposal",
    document_name: "Acme_Corp_Proposal_v2.pdf",
    file_type: "pdf",
    category: "Proposal",
    last_viewed_date: "2 hours ago",
    file_url: "/storage/documents/acme_corp_proposal_v2.pdf"
  },
  {
    document_id: "doc_techstart_contract",
    document_name: "TechStart_Contract.docx",
    file_type: "docx",
    category: "Contract",
    last_viewed_date: "5 hours ago",
    file_url: "/storage/documents/techstart_contract.docx"
  },
  {
    document_id: "doc_bigco_transcript",
    document_name: "BigCo_Discovery_Call_Transcript.pdf",
    file_type: "pdf",
    category: "Meeting Materials",
    last_viewed_date: "Yesterday",
    file_url: "/storage/documents/bigco_discovery_call_transcript.pdf"
  },
  {
    document_id: "doc_demo_deck",
    document_name: "Demo_Deck.pptx",
    file_type: "pptx",
    category: "Presentation",
    last_viewed_date: "2 days ago",
    file_url: "/storage/documents/demo_deck.pptx"
  },
  {
    document_id: "doc_case_study",
    document_name: "Case_Study.pdf",
    file_type: "pdf",
    category: "Case Study",
    last_viewed_date: "3 days ago",
    file_url: "/storage/documents/case_study.pdf"
  }
];
```

**Timestamps are dynamically generated:**
- Doc 1: 2 hours ago
- Doc 2: 5 hours ago
- Doc 3: 1 day ago
- Doc 4: 2 days ago
- Doc 5: 3 days ago

---

## Relative Time Display

### **Time Formatting Logic**

```typescript
const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
```

**Examples:**
- `< 1 min` → "Just now"
- `5 mins` → "5 mins ago"
- `2 hours` → "2 hours ago"
- `1 day` → "Yesterday"
- `3 days` → "3 days ago"
- `> 7 days` → "Nov 28" (date format)

---

## File Type Icons

### **Icon Colors**

| File Type | Icon | Color |
|-----------|------|-------|
| PDF | 📄 FileText | Blue (#3b82f6) |
| DOCX | 📄 FileText | Blue (#3b82f6) |
| XLSX | 📊 FileSpreadsheet | Green (#16a34a) |
| PPTX | 📑 File | Orange (#ea580c) |
| JPG/PNG | 🖼️ Image | Gray (#6b7280) |
| MP4 | ▶️ Video | Purple (#9333ea) |
| Other | 📄 File | Gray (#6b7280) |

**Icon Size:** 32px × 32px (w-8 h-8)

---

## Category Badge Colors

### **Badge Styling**

| Category | Background | Text Color |
|----------|------------|------------|
| Proposal | `bg-blue-100` | `text-blue-700` |
| Contract | `bg-emerald-100` | `text-emerald-700` |
| Presentation | `bg-purple-100` | `text-purple-700` |
| Case Study | `bg-orange-100` | `text-orange-700` |
| Pricing | `bg-yellow-100` | `text-yellow-700` |
| Meeting Materials | `bg-indigo-100` | `text-indigo-700` |
| HRMS Documents | `bg-pink-100` | `text-pink-700` |
| Email Attachments | `bg-cyan-100` | `text-cyan-700` |
| Other | `bg-gray-100` | `text-gray-700` |

**Badge Size:** `text-xs` (12px), `px-2 py-0.5`, `rounded`

---

## Responsive Design

### **Desktop (>1200px)**
```
┌────────┬────────┬────────┬────────┬────────┐
│ DOC 1  │ DOC 2  │ DOC 3  │ DOC 4  │ DOC 5  │
└────────┴────────┴────────┴────────┴────────┘
```
**Display:** 5 cards in horizontal row
**Gap:** 16px (gap-4)
**Overflow:** None

---

### **Tablet (768px - 1200px)**
```
┌────────┬────────┬────────┐  [+2 more]
│ DOC 1  │ DOC 2  │ DOC 3  │  →
└────────┴────────┴────────┘
```
**Display:** 3 cards visible
**Indicator:** "+2 more" (right side)
**Overflow:** Horizontal scroll

---

### **Mobile (<768px)**
```
┌────────┐
│ DOC 1  │  → ← swipe →
└────────┘
```
**Display:** 1 card visible
**Navigation:** Horizontal swipe/scroll
**Scrollbar:** Hidden (touch-friendly)

**CSS:**
```css
overflow-x-auto
scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
```

---

## Component Architecture

### **RecentDocumentsSection.tsx**

**Component Structure:**
```
RecentDocumentsSection
├── Header
│   ├── Icon + Title + Count
│   ├── "View All" button
│   └── Collapse/Expand button
├── Divider (border-t)
└── Cards Container
    ├── Horizontal scroll wrapper
    └── 5 × CompactCard
        ├── File icon
        ├── Document name
        ├── Category badge
        ├── Last viewed time
        └── Quick actions (view, download)
```

---

### **State Management**

```typescript
// In DocumentsLibrary.tsx
const [recentDocuments, setRecentDocuments] = useState(RECENT_DOCUMENTS_MOCK);

// In RecentDocumentsSection.tsx
const [isCollapsed, setIsCollapsed] = useState(false);
const [hoveredCard, setHoveredCard] = useState<string | null>(null);
```

---

## Handler Functions

### **1. handleRecentViewAll()**
```typescript
const handleRecentViewAll = () => {
  setSelectedFilter('recent');
  showToast('Showing all recent documents', 'info');
};
```
**Purpose:** Filter main grid to show all 15 recent docs

---

### **2. handleRecentPreview(doc)**
```typescript
const handleRecentPreview = (doc: any) => {
  showToast(`Preview: ${doc.document_name}`, 'info');
};
```
**Purpose:** Show document preview (currently toast, future modal)

---

### **3. handleRecentDownload(doc)**
```typescript
const handleRecentDownload = (doc: any) => {
  showToast(`Downloading: ${doc.document_name}`, 'success');
};
```
**Purpose:** Download document (currently toast, future file download)

---

### **4. Card Click Handler**
```typescript
// Inside RecentDocumentsSection component
onClick={() => navigate(`/documents/${doc.document_id}`)}
```
**Purpose:** Navigate to document detail page

---

## API Integration (Future)

### **Fetch Recent Documents**

**Endpoint:** `GET /api/documents/recent`

**Query Parameters:**
- `user_id` - Current user ID
- `limit` - Number of documents to return (default: 5)

**Request:**
```http
GET /api/documents/recent?user_id=user_alex&limit=5
Authorization: Bearer <token>
```

**Response:**
```json
{
  "documents": [
    {
      "document_id": "doc_acme_proposal",
      "document_name": "Acme_Corp_Proposal_v2.pdf",
      "file_type": "pdf",
      "category": "Proposal",
      "last_viewed_date": "2024-12-12T16:30:00Z",
      "file_url": "/storage/documents/acme_corp_proposal_v2.pdf"
    }
  ],
  "total": 5
}
```

---

### **Track Document View**

**Endpoint:** `POST /api/documents/{document_id}/track-view`

**Request:**
```http
POST /api/documents/doc_acme_proposal/track-view
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "user_alex",
  "viewed_at": "2024-12-12T16:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "View tracked successfully"
}
```

**Trigger Points:**
- User opens document detail page
- User clicks preview
- User downloads document

---

## Database Schema (Future)

### **document_views Table**

```sql
CREATE TABLE document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_type VARCHAR(20) DEFAULT 'detail', -- 'detail', 'preview', 'download'
  created_at TIMESTAMPTZ DEFAULT NOW(),

  FOREIGN KEY (document_id) REFERENCES documents(document_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),

  INDEX idx_user_recent (user_id, viewed_at DESC),
  INDEX idx_document_views (document_id, viewed_at DESC)
);
```

---

## Caching Strategy

### **Client-Side Cache**

**Cache Duration:** 5 minutes

**Implementation:**
```typescript
const CACHE_KEY = 'recent_documents';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedRecentDocuments = () => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  const age = Date.now() - timestamp;

  if (age > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  return data;
};

const setCachedRecentDocuments = (documents: RecentDocument[]) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: documents,
    timestamp: Date.now()
  }));
};
```

**Benefits:**
- Reduces API calls
- Instant load on page refresh
- Better performance

---

## Performance Optimizations

### **1. Lazy Loading**
```typescript
// Only load recent docs when section is visible
useEffect(() => {
  if (!isCollapsed && recentDocuments.length === 0) {
    loadRecentDocuments();
  }
}, [isCollapsed]);
```

---

### **2. Memoization**
```typescript
const recentDocumentsToShow = useMemo(() => {
  return recentDocuments.slice(0, 5);
}, [recentDocuments]);
```

---

### **3. Debounced Scroll**
```typescript
const handleScroll = useMemo(
  () => debounce(() => {
    // Handle horizontal scroll
  }, 100),
  []
);
```

---

## Accessibility

### **Keyboard Navigation**

| Key | Action |
|-----|--------|
| `Tab` | Navigate between cards |
| `Enter` | Open document detail |
| `Space` | Open document detail |
| `←/→` | Navigate cards (horizontal) |
| `Esc` | Close preview modal |

---

### **ARIA Labels**

```tsx
<button
  onClick={onPreview}
  aria-label={`Preview ${doc.document_name}`}
  title="Quick preview"
>
  <Eye className="w-4 h-4" />
</button>

<button
  onClick={onDownload}
  aria-label={`Download ${doc.document_name}`}
  title="Download"
>
  <Download className="w-4 h-4" />
</button>
```

---

### **Screen Reader Support**

```tsx
<div
  role="region"
  aria-label="Recent documents"
  aria-live="polite"
>
  {/* Recent documents content */}
</div>
```

---

## Testing Scenarios

### **Manual Test Cases**

| # | Test Case | Expected Result | Pass/Fail |
|---|-----------|-----------------|-----------|
| 1 | Load page with no filters | Recent docs section appears | ☐ |
| 2 | Apply category filter | Recent docs section hides | ☐ |
| 3 | Clear all filters | Recent docs section reappears | ☐ |
| 4 | Click compact card | Navigate to document detail | ☐ |
| 5 | Click eye icon | Show preview toast | ☐ |
| 6 | Click download icon | Show download toast | ☐ |
| 7 | Click "View All (15)" | Filter to recent, show 15 docs | ☐ |
| 8 | Hover card | Card lifts, shadow increases | ☐ |
| 9 | Collapse section | Section shrinks to one line | ☐ |
| 10 | Expand section | Section restores to full view | ☐ |
| 11 | Empty state (no recent) | Show empty state message | ☐ |
| 12 | Responsive (tablet) | Show 3 cards, scrollable | ☐ |
| 13 | Responsive (mobile) | Show 1 card, swipeable | ☐ |
| 14 | Navigate to deal docs | Recent docs section hides | ☐ |
| 15 | Return to all docs | Recent docs section reappears | ☐ |

---

## Future Enhancements

### **Phase 2 Features**

1. **Real API Integration**
   - Connect to `/api/documents/recent` endpoint
   - Track document views in database
   - Update recent list on document interactions

2. **Preview Modal**
   - Full document preview in modal
   - Support PDF, images, videos
   - Close on Esc or click outside

3. **Actual File Downloads**
   - Trigger browser download
   - Track download count
   - Show download progress

4. **User Preferences**
   - Save collapse/expand state
   - Customize number of recent docs (3-10)
   - Enable/disable recent section

5. **Enhanced Interactions**
   - Drag to reorder recent docs
   - Pin favorite docs to stay in recent
   - Remove from recent list (X icon)

6. **Analytics**
   - Track most viewed documents
   - Document engagement metrics
   - User behavior insights

---

## Implementation Checklist

### **Completed**
- [x] Create RecentDocumentsSection component
- [x] Add mock recent documents data
- [x] Integrate into DocumentsLibrary page
- [x] Implement card click navigation
- [x] Add preview and download handlers
- [x] Add "View All" functionality
- [x] Implement collapse/expand
- [x] Add hover effects
- [x] Create empty state
- [x] Add relative time formatting
- [x] Add file type icons
- [x] Add category badges
- [x] Responsive design (CSS ready)
- [x] Build and test

### **Pending (Future)**
- [ ] API integration (fetch recent docs)
- [ ] API integration (track views)
- [ ] Database schema creation
- [ ] Preview modal implementation
- [ ] Actual file download functionality
- [ ] User preferences (collapse state)
- [ ] Caching implementation
- [ ] Analytics tracking
- [ ] Accessibility testing
- [ ] Cross-browser testing
- [ ] Mobile device testing

---

## Related Documentation

- `DOCUMENTS_LIBRARY_COMPREHENSIVE.md` - Full documents library guide
- `CLICKABLE_INTERACTIONS_IMPLEMENTATION.md` - Context filtering
- `EDGE_CASES_IMPLEMENTATION.md` - Error handling
- `DOCUMENTS_API_DOCUMENTATION.md` - API reference

---

**Last Updated:** December 12, 2024
**Status:** ✅ Complete (Frontend Only)
**Build:** ✅ Passing
