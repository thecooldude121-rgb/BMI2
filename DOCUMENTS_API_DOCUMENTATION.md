# Documents Library API Documentation
**Context-Aware Document Filtering System**
**Version:** 1.0.0
**Last Updated:** December 12, 2024

---

## Overview

Complete REST API documentation for the Documents Library with context-aware filtering capabilities.

**Base URL:** `/api/v1`

**Authentication:** Bearer Token (JWT)

**Content-Type:** `application/json` (except file uploads: `multipart/form-data`)

---

## Table of Contents

1. [Authentication](#authentication)
2. [List Documents](#list-documents)
3. [Upload Documents](#upload-documents)
4. [Get Document](#get-document)
5. [Delete Document](#delete-document)
6. [Context Filtering](#context-filtering)
7. [Edge Cases](#edge-cases)
8. [Response Structures](#response-structures)
9. [Error Codes](#error-codes)

---

## Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer <your-jwt-token>
```

---

## List Documents

### GET `/documents`

Retrieve documents with optional context filtering and search parameters.

#### Basic Request (All Documents)

```http
GET /documents
Authorization: Bearer <token>
```

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_acme_001",
      "document_name": "Acme_Corp_Proposal_v2.pdf",
      "category": "Proposal",
      "file_size": 2457600,
      "uploaded_by": "Sarah Chen",
      "uploaded_at": "2024-12-01T14:30:00Z",
      "deal_id": "deal_acme_001",
      "deal_name": "Acme Corp - Enterprise Plan",
      "account_id": "account_acme",
      "account_name": "Acme Corp",
      "tags": ["enterprise", "proposal", "v2"],
      "description": "Final proposal for enterprise plan",
      "visibility": "team"
    }
    // ... more documents
  ],
  "total": 247,
  "page": 1,
  "per_page": 50,
  "context": null
}
```

---

### Context Filtering (Deal)

#### Request

```http
GET /documents?deal_id=deal_acme_001&deal_name=Acme%20Corp%20-%20Enterprise%20Plan
Authorization: Bearer <token>
```

#### Response

```json
{
  "documents": [
    {
      "id": "doc_acme_001",
      "document_name": "Acme_Corp_Proposal_v2.pdf",
      "category": "Proposal",
      "file_size": 2457600,
      "uploaded_by": "Sarah Chen",
      "uploaded_at": "2024-12-01T14:30:00Z",
      "deal_id": "deal_acme_001",
      "deal_name": "Acme Corp - Enterprise Plan",
      "account_id": "account_acme",
      "account_name": "Acme Corp",
      "tags": ["enterprise", "proposal", "v2"]
    },
    {
      "id": "doc_acme_002",
      "document_name": "Acme_Meeting_Notes_Nov_2024.pdf",
      "category": "Meeting Materials",
      "file_size": 983040,
      "uploaded_by": "Mike Rodriguez",
      "uploaded_at": "2024-11-15T10:20:00Z",
      "deal_id": "deal_acme_001",
      "account_id": "account_acme"
    },
    {
      "id": "doc_acme_003",
      "document_name": "Acme_Contract_Draft.docx",
      "category": "Contract",
      "file_size": 1048576,
      "uploaded_by": "Sarah Chen",
      "uploaded_at": "2024-12-05T16:45:00Z",
      "deal_id": "deal_acme_001",
      "account_id": "account_acme"
    }
  ],
  "total": 3,
  "page": 1,
  "per_page": 50,
  "context": {
    "type": "deal",
    "deal_id": "deal_acme_001",
    "deal_name": "Acme Corp - Enterprise Plan",
    "account_id": "account_acme",
    "account_name": "Acme Corp"
  }
}
```

---

### Context Filtering (Account with HRMS)

#### Request

```http
GET /documents?account_id=account_techstart&account_name=TechStart%20Inc&hrms_connected=true
Authorization: Bearer <token>
```

#### Response

```json
{
  "documents": [
    // 11 documents related to TechStart Inc
  ],
  "total": 11,
  "context": {
    "type": "account",
    "account_id": "account_techstart",
    "account_name": "TechStart Inc",
    "hrms_connected": true
  }
}
```

---

### Context Filtering (Contact with Rich Metadata)

#### Request

```http
GET /documents?contact_id=contact_sarah_lee&contact_name=Sarah%20Lee&title=CFO&account_name=TechStart%20Inc&hrms_connected=true
Authorization: Bearer <token>
```

#### Response

```json
{
  "documents": [
    // 10 documents related to Sarah Lee
  ],
  "total": 10,
  "context": {
    "type": "contact",
    "contact_id": "contact_sarah_lee",
    "contact_name": "Sarah Lee",
    "title": "CFO",
    "account_name": "TechStart Inc",
    "hrms_connected": true
  }
}
```

---

### Context Filtering (Activity)

#### Request

```http
GET /documents?activity_id=act_techstart_001&activity_name=TechStart%20Discovery%20Call&activity_type=Meeting
Authorization: Bearer <token>
```

#### Response

```json
{
  "documents": [
    // 7 documents from this activity
  ],
  "total": 7,
  "context": {
    "type": "activity",
    "activity_id": "act_techstart_001",
    "activity_name": "TechStart Discovery Call",
    "activity_type": "Meeting"
  }
}
```

---

### Combined Filters (Category + Source)

#### Request

```http
GET /documents?category=Meeting%20Materials&source=AI
Authorization: Bearer <token>
```

#### Response

```json
{
  "documents": [
    // 13 AI-generated meeting transcripts
  ],
  "total": 13,
  "context": {
    "type": "category",
    "category": "Meeting Materials",
    "source": "AI"
  },
  "appliedFilters": ["category", "source"]
}
```

---

### Multiple Filters (Account + Category)

#### Request

```http
GET /documents?account_id=account_techstart&account_name=TechStart%20Inc&category=HRMS%20Documents
Authorization: Bearer <token>
```

#### Response

```json
{
  "documents": [
    {
      "id": "doc_techstart_hrms_001",
      "document_name": "Employee_Onboarding_Template.pdf",
      "category": "HRMS Documents",
      "file_size": 1572864,
      "uploaded_by": "System (HRMS)",
      "uploaded_at": "2024-11-20T09:00:00Z",
      "account_id": "account_techstart",
      "account_name": "TechStart Inc",
      "source": "HRMS"
    },
    {
      "id": "doc_techstart_hrms_002",
      "document_name": "TechStart_Org_Chart.pdf",
      "category": "HRMS Documents",
      "file_size": 2097152,
      "uploaded_by": "System (HRMS)",
      "uploaded_at": "2024-11-25T11:30:00Z",
      "account_id": "account_techstart",
      "source": "HRMS"
    }
  ],
  "total": 2,
  "context": {
    "type": "account",
    "account_id": "account_techstart",
    "account_name": "TechStart Inc"
  },
  "appliedFilters": ["category"]
}
```

---

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `deal_id` | string | No | Filter by deal ID | `deal_acme_001` |
| `deal_name` | string | No | Deal name for display | `Acme Corp - Enterprise Plan` |
| `account_id` | string | No | Filter by account ID | `account_techstart` |
| `account_name` | string | No | Account name for display | `TechStart Inc` |
| `hrms_connected` | boolean | No | HRMS connection status | `true` |
| `contact_id` | string | No | Filter by contact ID | `contact_sarah_lee` |
| `contact_name` | string | No | Contact name for display | `Sarah Lee` |
| `title` | string | No | Contact job title | `CFO` |
| `activity_id` | string | No | Filter by activity ID | `act_techstart_001` |
| `activity_name` | string | No | Activity name for display | `Discovery Call` |
| `activity_type` | string | No | Type of activity | `Meeting` |
| `category` | string | No | Filter by category | `Meeting Materials` |
| `source` | string | No | Filter by source | `AI` |
| `search` | string | No | Search term | `proposal` |
| `page` | integer | No | Page number (default: 1) | `2` |
| `per_page` | integer | No | Results per page (default: 50) | `25` |
| `sort_by` | string | No | Sort field | `uploaded_at` |
| `sort_order` | string | No | Sort direction | `desc` |

---

### Context Priority Order

When multiple context parameters are provided, the API uses this priority:

1. **Entity Context** (highest priority)
   - `deal_id` → Deal context
   - `account_id` → Account context
   - `contact_id` → Contact context
   - `activity_id` → Activity context

2. **Combined Filters**
   - `category` + `source` → Both applied

3. **Single Filters** (lowest priority)
   - `category` alone
   - `source` alone

**Example:**
```http
# If both deal_id AND category are present:
GET /documents?deal_id=deal_001&category=Proposals

# Result: Deal context takes priority, category is an additional filter
{
  "context": { "type": "deal", ... },
  "appliedFilters": ["category"]
}
```

---

## Upload Documents

### POST `/documents/upload`

Upload one or more documents with optional context linking.

#### Request (Without Context)

```http
POST /documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  file: [File]
  document_name: "New_Proposal.pdf"
  category: "Proposal"
  description: "Client proposal for review"
  tags: ["proposal", "draft"]
  visibility: "team"
```

#### Request (With Context - Auto-linked)

```http
POST /documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
  file: [File]
  document_name: "New_Proposal.pdf"
  category: "Proposal"
  deal_id: "deal_acme_001"        # From context
  account_id: "account_acme"      # From context
  description: "Final proposal version"
  tags: ["proposal", "final", "v3"]
  visibility: "team"
```

#### Response (Success)

```json
{
  "success": true,
  "document": {
    "id": "doc_acme_004",
    "document_name": "New_Proposal.pdf",
    "category": "Proposal",
    "file_size": 3145728,
    "uploaded_by": "Sarah Chen",
    "uploaded_at": "2024-12-12T10:30:00Z",
    "deal_id": "deal_acme_001",
    "deal_name": "Acme Corp - Enterprise Plan",
    "account_id": "account_acme",
    "account_name": "Acme Corp",
    "tags": ["proposal", "final", "v3"],
    "description": "Final proposal version",
    "visibility": "team",
    "url": "https://storage.example.com/documents/doc_acme_004.pdf"
  },
  "message": "Document uploaded successfully"
}
```

#### Response (Error - File Too Large)

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum limit of 50MB",
    "details": {
      "file_size": 52428800,
      "max_size": 52428800,
      "file_name": "Large_Document.pdf"
    }
  }
}
```

---

### Upload Request Fields

| Field | Type | Required | Max Size | Description |
|-------|------|----------|----------|-------------|
| `file` | File | Yes | 50MB | Document file to upload |
| `document_name` | string | Yes | 255 chars | Display name |
| `category` | string | Yes | - | Document category |
| `description` | string | No | 500 chars | Document description |
| `tags` | string[] | No | 10 tags | Tags for organization |
| `deal_id` | string | No | - | Link to deal |
| `account_id` | string | No | - | Link to account |
| `contact_id` | string | No | - | Link to contact |
| `activity_id` | string | No | - | Link to activity |
| `visibility` | string | No | - | `private`, `team`, `company` |
| `team_members` | string[] | No | - | User IDs (if visibility=team) |

---

### Supported File Types

| Category | Extensions | MIME Types |
|----------|-----------|------------|
| **Documents** | `.pdf`, `.doc`, `.docx` | `application/pdf`, `application/msword` |
| **Spreadsheets** | `.xls`, `.xlsx`, `.csv` | `application/vnd.ms-excel` |
| **Presentations** | `.ppt`, `.pptx` | `application/vnd.ms-powerpoint` |
| **Images** | `.jpg`, `.jpeg`, `.png` | `image/jpeg`, `image/png` |
| **Text** | `.txt`, `.md` | `text/plain`, `text/markdown` |
| **Archives** | `.zip` | `application/zip` |

**Maximum File Size:** 50MB

**Maximum Files Per Upload:** 10 files

---

## Get Document

### GET `/documents/:id`

Retrieve a single document by ID.

#### Request

```http
GET /documents/doc_acme_001
Authorization: Bearer <token>
```

#### Response

```json
{
  "document": {
    "id": "doc_acme_001",
    "document_name": "Acme_Corp_Proposal_v2.pdf",
    "category": "Proposal",
    "file_size": 2457600,
    "uploaded_by": "Sarah Chen",
    "uploaded_at": "2024-12-01T14:30:00Z",
    "deal_id": "deal_acme_001",
    "deal_name": "Acme Corp - Enterprise Plan",
    "account_id": "account_acme",
    "account_name": "Acme Corp",
    "contact_ids": ["contact_sarah_lee", "contact_john_smith"],
    "tags": ["enterprise", "proposal", "v2"],
    "description": "Final proposal for enterprise plan",
    "visibility": "team",
    "team_members": ["user_sarah_chen", "user_mike"],
    "url": "https://storage.example.com/documents/doc_acme_001.pdf",
    "version": 2,
    "versions": [
      {
        "version": 1,
        "uploaded_at": "2024-11-28T10:00:00Z",
        "uploaded_by": "Sarah Chen",
        "url": "https://storage.example.com/documents/doc_acme_001_v1.pdf"
      }
    ],
    "activity_log": [
      {
        "action": "uploaded",
        "user": "Sarah Chen",
        "timestamp": "2024-12-01T14:30:00Z"
      },
      {
        "action": "viewed",
        "user": "Mike Rodriguez",
        "timestamp": "2024-12-02T09:15:00Z"
      }
    ]
  }
}
```

---

## Delete Document

### DELETE `/documents/:id`

Delete a document (soft delete by default).

#### Request

```http
DELETE /documents/doc_acme_001
Authorization: Bearer <token>
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `permanent` | boolean | `false` | Permanently delete (cannot undo) |

#### Response (Success)

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "document_id": "doc_acme_001",
  "deleted_at": "2024-12-12T10:45:00Z"
}
```

#### Response (Error - Permission Denied)

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to delete this document",
    "details": {
      "document_id": "doc_acme_001",
      "required_permission": "documents:delete"
    }
  }
}
```

---

## Context Filtering

### How Context Filtering Works

Context filtering allows users to view documents related to specific entities (deals, accounts, contacts, activities) or filtered by metadata (category, source).

**Filter Combination Logic:**

1. **Primary Context Filter** (first)
   - Filters documents by entity ID
   - Example: `deal_id=deal_001` → Shows only docs linked to this deal

2. **Additional Filters** (second - narrows results)
   - Category filter
   - Source filter
   - Example: Adding `category=Proposals` → Shows only proposals within the deal

3. **Search Query** (third - narrows further)
   - Full-text search within filtered results
   - Searches: name, description, tags

**AND Logic:** All filters combine with AND logic (intersection of results)

---

### Context Types

| Type | Primary Parameter | Optional Parameters | Description |
|------|------------------|---------------------|-------------|
| **Deal** | `deal_id` | `deal_name` | Documents linked to a deal |
| **Account** | `account_id` | `account_name`, `hrms_connected` | Documents for an account |
| **Contact** | `contact_id` | `contact_name`, `title`, `account_name` | Documents for a contact |
| **Activity** | `activity_id` | `activity_name`, `activity_type` | Documents from an activity |
| **Category** | `category` | - | Documents in a category |
| **Source** | `source` | - | Documents from a source |
| **Combined** | `category` + `source` | - | Documents matching both |

---

### Example Workflows

#### Workflow 1: View Deal Documents

**User Action:** Click "View Documents" from deal detail page

**API Call:**
```http
GET /documents?deal_id=deal_acme_001&deal_name=Acme%20Corp%20-%20Enterprise%20Plan
```

**UI Display:**
- Context banner: "Showing documents for: Acme Corp - Enterprise Plan (Deal)"
- 6 documents shown
- Sidebar "Deals" auto-checked

---

#### Workflow 2: Add Category Filter

**User Action:** Click "Proposals" in sidebar while viewing deal docs

**API Call:**
```http
GET /documents?deal_id=deal_acme_001&deal_name=Acme%20Corp&category=Proposal
```

**UI Display:**
- Context banner: "Showing Proposals for: Acme Corp (Deal)"
- 1 document shown (only proposals within that deal)
- Button changes to "Clear All Filters"

---

#### Workflow 3: AI Meeting Transcripts

**User Action:** Click "View AI Transcripts" from AI Assistant

**API Call:**
```http
GET /documents?category=Meeting%20Materials&source=AI
```

**UI Display:**
- Context banner: "AI Meeting Materials"
- 13 documents shown (all AI-generated transcripts)
- Both category and source filters active

---

#### Workflow 4: Upload from Context

**User Action:** Click "+ Upload Document" while viewing deal docs

**UI Behavior:**
- Modal opens with blue banner: "Auto-linked to current deal"
- Deal field pre-filled: "Acme Corp - Enterprise Plan"
- Account field pre-filled: "Acme Corp"

**API Call on Upload:**
```http
POST /documents/upload
Body: {
  file: [File],
  document_name: "New_Contract.pdf",
  category: "Contract",
  deal_id: "deal_acme_001",     # Pre-filled from context
  account_id: "account_acme"    # Pre-filled from context
}
```

---

## Edge Cases

The API handles various edge cases gracefully to ensure robust error handling and clear user feedback.

---

### **EDGE CASE 1: Invalid Context ID**

Entity ID provided doesn't exist in the database.

#### Request

```http
GET /documents?deal_id=deal_invalid_999&deal_name=Fake%20Deal
Authorization: Bearer <token>
```

#### Response (404 Not Found)

```json
{
  "success": false,
  "error": {
    "code": "CONTEXT_NOT_FOUND",
    "message": "Deal not found",
    "details": {
      "context_type": "deal",
      "context_id": "deal_invalid_999",
      "reason": "Entity does not exist in database"
    },
    "suggestions": [
      "Check the deal ID for typos",
      "Verify the deal hasn't been deleted",
      "Contact support if this is unexpected"
    ]
  },
  "fallback": {
    "action": "show_all",
    "documents": [],
    "total": 247,
    "context": null
  }
}
```

#### **UI Behavior:**
- Show error banner: "⚠️ Deal not found. Showing all documents instead."
- Auto-clear invalid filter from URL
- Display all 247 documents (fallback)
- User can dismiss banner
- Log error to analytics

---

### **EDGE CASE 2: Context Record Deleted**

User bookmarked URL with valid ID, but record was later soft-deleted.

#### Request

```http
GET /documents?deal_id=deal_deleted_001&deal_name=Old%20Deal
Authorization: Bearer <token>
```

#### Response (410 Gone)

```json
{
  "success": false,
  "error": {
    "code": "CONTEXT_DELETED",
    "message": "This deal no longer exists",
    "details": {
      "context_type": "deal",
      "context_id": "deal_deleted_001",
      "reason": "Entity was soft-deleted",
      "deleted_at": "2024-11-15T10:30:00Z"
    },
    "suggestions": [
      "View archived deals to access deleted records",
      "Contact an admin to restore this deal"
    ]
  },
  "fallback": {
    "action": "show_all",
    "documents": [],
    "total": 247,
    "context": null
  }
}
```

#### **UI Behavior:**
- Show warning banner: "⚠️ This deal no longer exists. Showing all documents."
- Context cleared automatically
- Update browser history (remove invalid params)
- Optionally suggest "View Archive" link

---

### **EDGE CASE 3: Multiple Context Parameters**

URL contains conflicting entity context parameters.

#### Request

```http
GET /documents?deal_id=deal_acme_001&account_id=account_techstart&deal_name=Acme%20Deal
Authorization: Bearer <token>
```

#### Response (200 OK - Priority Applied)

```json
{
  "documents": [
    // Documents for deal_acme_001 only
  ],
  "total": 6,
  "context": {
    "type": "deal",
    "deal_id": "deal_acme_001",
    "deal_name": "Acme Corp - Enterprise Plan"
  },
  "warning": {
    "code": "MULTIPLE_CONTEXTS_DETECTED",
    "message": "Multiple context parameters detected. Using Deal context (priority).",
    "details": {
      "primary_context": "deal_id",
      "ignored_contexts": ["account_id"]
    }
  }
}
```

#### **Priority Order:**
1. `deal_id` (highest)
2. `account_id`
3. `contact_id`
4. `activity_id` (lowest)

#### **UI Behavior:**
- Show info banner (auto-dismiss after 8s): "ℹ️ Multiple contexts detected. Using Deal (priority). Ignored: account"
- Apply deal filter only
- Log conflict to analytics
- Console warning with details

---

### **EDGE CASE 4: Permission Denied**

User doesn't have access to requested entity.

#### Request

```http
GET /documents?deal_id=deal_confidential_001
Authorization: Bearer <token>
```

#### Response (403 Forbidden)

```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You don't have permission to view this deal",
    "details": {
      "context_type": "deal",
      "context_id": "deal_confidential_001",
      "reason": "User is not a team member on this deal",
      "required_permission": "deals:read"
    },
    "suggestions": [
      "Request access from the deal owner",
      "Contact your manager for permissions"
    ]
  },
  "fallback": {
    "action": "show_accessible",
    "documents": [],
    "total": 195,
    "context": null
  }
}
```

#### **UI Behavior:**
- Show error banner: "🔒 Access denied. You don't have permission to view this deal."
- Show "Request Access" button
- Display only accessible documents
- Log security event

---

### **EDGE CASE 5: Invalid ID Format**

Entity ID format doesn't match expected pattern.

#### Request

```http
GET /documents?deal_id=contact_john_smith
Authorization: Bearer <token>
```

#### Response (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CONTEXT_FORMAT",
    "message": "Invalid deal ID format",
    "details": {
      "context_type": "deal",
      "context_id": "contact_john_smith",
      "reason": "ID does not match expected pattern",
      "expected_format": "deal_[alphanumeric_underscore]",
      "example": "deal_acme_001"
    }
  },
  "fallback": {
    "action": "show_all",
    "documents": [],
    "total": 247,
    "context": null
  }
}
```

#### **Expected ID Patterns:**
| Entity Type | Pattern | Example |
|------------|---------|---------|
| Deal | `deal_[a-z0-9_]+` | `deal_acme_001` |
| Account | `account_[a-z0-9_]+` | `account_techstart` |
| Contact | `contact_[a-z0-9_]+` | `contact_sarah_lee` |
| Activity | `act_[a-z0-9_]+` | `act_demo_001` |

#### **UI Behavior:**
- Show error banner: "⚠️ Invalid deal ID format. Showing all documents instead."
- Clear invalid parameter
- Console log with format hint

---

### **EDGE CASE 6: Valid Context, Empty Result Set**

Valid context but no documents associated (not an error).

#### Request

```http
GET /documents?deal_id=deal_new_001&deal_name=New%20Deal
Authorization: Bearer <token>
```

#### Response (200 OK)

```json
{
  "documents": [],
  "total": 0,
  "context": {
    "type": "deal",
    "deal_id": "deal_new_001",
    "deal_name": "New Deal"
  },
  "empty_state": {
    "type": "context_aware",
    "message": "No documents found for this deal",
    "suggestions": [
      "Upload your first document to get started",
      "Documents uploaded will be automatically linked to this deal"
    ]
  }
}
```

#### **UI Behavior:**
- Keep context banner active: "New Deal (Deal)"
- Show context-aware empty state:
  - Icon: Empty folder
  - Message: "No documents found for this deal"
  - CTA: "+ Upload Document" (auto-links to deal)
- No error message (this is expected state)

---

### Edge Case Handling Summary

| Edge Case | HTTP Status | Error Code | User Message | Fallback Action |
|-----------|-------------|------------|--------------|-----------------|
| Invalid ID | 404 | `CONTEXT_NOT_FOUND` | "Deal not found" | Show all documents |
| Deleted Record | 410 | `CONTEXT_DELETED` | "Deal no longer exists" | Show all documents |
| Multiple Contexts | 200 | `MULTIPLE_CONTEXTS_DETECTED` | "Using Deal (priority)" | Apply primary context |
| Permission Denied | 403 | `PERMISSION_DENIED` | "Access denied" | Show accessible docs |
| Invalid Format | 400 | `INVALID_CONTEXT_FORMAT` | "Invalid format" | Show all documents |
| Empty Result | 200 | None | "No documents found" | Keep context active |

---

### Error Response Format

All error responses follow this structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;               // Error code (e.g., "CONTEXT_NOT_FOUND")
    message: string;            // User-friendly message
    details: {
      context_type: string;     // Entity type ("deal", "account", etc.)
      context_id: string;       // Provided ID
      reason: string;           // Technical reason
      [key: string]: any;       // Additional context-specific fields
    };
    suggestions?: string[];     // Actionable suggestions for user
  };
  fallback?: {
    action: string;             // Fallback behavior
    documents: Document[];      // Alternative documents to show
    total: number;              // Total count
    context: Context | null;    // Applied context (if any)
  };
}
```

---

## Response Structures

### Document Object

```typescript
interface Document {
  id: string;                    // Unique document ID
  document_name: string;         // Display name
  category: string;              // Category (Proposal, Contract, etc.)
  file_size: number;             // Size in bytes
  file_type: string;             // MIME type
  uploaded_by: string;           // User name
  uploaded_at: string;           // ISO 8601 timestamp

  // Related Entities
  deal_id?: string;              // Linked deal ID
  deal_name?: string;            // Deal display name
  account_id?: string;           // Linked account ID
  account_name?: string;         // Account display name
  contact_ids?: string[];        // Linked contact IDs
  activity_id?: string;          // Linked activity ID

  // Metadata
  tags: string[];                // Tags for organization
  description?: string;          // Document description
  source?: string;               // Source (Manual, AI, HRMS, etc.)

  // Access Control
  visibility: 'private' | 'team' | 'company';
  team_members?: string[];       // User IDs (if visibility=team)

  // Storage
  url: string;                   // Download URL
  version?: number;              // Version number
}
```

---

### Context Object

```typescript
interface Context {
  type: 'deal' | 'account' | 'contact' | 'activity' | 'category' | 'source';

  // Deal Context
  deal_id?: string;
  deal_name?: string;

  // Account Context
  account_id?: string;
  account_name?: string;
  hrms_connected?: boolean;

  // Contact Context
  contact_id?: string;
  contact_name?: string;
  title?: string;              // Job title

  // Activity Context
  activity_id?: string;
  activity_name?: string;
  activity_type?: string;      // Meeting, Call, Email, etc.

  // Category/Source Context
  category?: string;
  source?: string;
}
```

---

### List Response

```typescript
interface ListDocumentsResponse {
  documents: Document[];         // Array of documents
  total: number;                 // Total count (before pagination)
  page: number;                  // Current page
  per_page: number;              // Results per page
  context: Context | null;       // Active context filter
  appliedFilters?: string[];     // Additional filters applied
}
```

---

### Upload Response

```typescript
interface UploadDocumentResponse {
  success: boolean;
  document?: Document;           // Uploaded document (if successful)
  message: string;               // Success/error message
  error?: ErrorObject;           // Error details (if failed)
}
```

---

## Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `UNAUTHORIZED` | 401 | Missing or invalid token | Provide valid Bearer token |
| `PERMISSION_DENIED` | 403 | Insufficient permissions | Request appropriate permissions |
| `NOT_FOUND` | 404 | Document not found | Verify document ID exists |
| `FILE_TOO_LARGE` | 400 | File exceeds 50MB limit | Reduce file size or compress |
| `INVALID_FILE_TYPE` | 400 | Unsupported file type | Use supported file formats |
| `INVALID_PARAMETERS` | 400 | Invalid query parameters | Check parameter format |
| `DUPLICATE_DOCUMENT` | 409 | Document already exists | Use different filename or version |
| `STORAGE_ERROR` | 500 | File storage failure | Retry upload or contact support |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry with backoff |

---

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum limit of 50MB",
    "details": {
      "file_size": 52428800,
      "max_size": 52428800,
      "file_name": "Large_Document.pdf"
    },
    "timestamp": "2024-12-12T10:45:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## Rate Limiting

**Default Limits:**
- 60 requests per minute
- 1000 requests per hour
- Upload limit: 10 files per request

**Response Headers:**
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1702389600
```

**Rate Limit Exceeded Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` (integer, default: 1)
- `per_page` (integer, default: 50, max: 100)

**Response includes:**
```json
{
  "documents": [...],
  "total": 247,
  "page": 2,
  "per_page": 50,
  "total_pages": 5
}
```

---

## Sorting

**Query Parameters:**
- `sort_by`: Field to sort by
  - `uploaded_at` (default)
  - `document_name`
  - `file_size`
  - `category`
- `sort_order`: Sort direction
  - `desc` (default)
  - `asc`

**Example:**
```http
GET /documents?sort_by=document_name&sort_order=asc
```

---

## Search

Full-text search across document fields:

**Query Parameter:**
- `search`: Search term (min 2 characters)

**Searchable Fields:**
- `document_name`
- `description`
- `tags`

**Example:**
```http
GET /documents?search=proposal&deal_id=deal_001
```

Result: Searches for "proposal" only within documents for deal_001

---

## Testing

### Test URLs

Use these URLs for testing context filtering:

```bash
# Deal context
/documents?deal_id=deal_acme_001&deal_name=Acme%20Corp%20-%20Enterprise%20Plan

# Account context (with HRMS)
/documents?account_id=account_techstart&account_name=TechStart%20Inc&hrms_connected=true

# Contact context (rich metadata)
/documents?contact_id=contact_sarah_lee&contact_name=Sarah%20Lee&title=CFO&account_name=TechStart%20Inc

# Activity context
/documents?activity_id=act_techstart_001&activity_name=Discovery%20Call&activity_type=Meeting

# Combined filters (AI transcripts)
/documents?category=Meeting%20Materials&source=AI

# Multiple filters (account + category)
/documents?account_id=account_techstart&category=HRMS%20Documents

# Empty state
/documents?deal_id=fake_999&deal_name=Test%20Deal
```

---

## Best Practices

### 1. Always Include Display Names
When providing entity IDs, include display names for better UX:
```http
✅ Good: ?deal_id=deal_001&deal_name=Acme%20Corp
❌ Bad:  ?deal_id=deal_001
```

### 2. URL Encode Parameters
Always encode special characters:
```javascript
const dealName = "Acme Corp - Enterprise Plan";
const encoded = encodeURIComponent(dealName);
// Result: "Acme%20Corp%20-%20Enterprise%20Plan"
```

### 3. Use Context for Uploads
When uploading from a context page, always pass entity IDs:
```javascript
// User is viewing deal docs, uploads new file
const formData = new FormData();
formData.append('deal_id', currentDealId);      // From context
formData.append('account_id', currentAccountId); // From context
```

### 4. Handle Empty States
Check `total` count and show appropriate empty state:
```javascript
if (response.total === 0 && response.context) {
  showContextEmptyState(response.context.type);
} else if (response.total === 0) {
  showGeneralEmptyState();
}
```

### 5. Preserve Context in URLs
Use URL parameters to maintain context across navigation:
```javascript
// User navigates to document detail, then back
navigate(`/documents/detail/${docId}?deal_id=${dealId}`);
// Back button preserves context
```

---

## Implementation Notes

### Frontend Implementation
```typescript
// Example: Fetch documents with context
const loadDocuments = async () => {
  const dealId = searchParams.get('deal_id');
  const dealName = searchParams.get('deal_name');

  const url = dealId
    ? `/api/v1/documents?deal_id=${dealId}&deal_name=${encodeURIComponent(dealName)}`
    : '/api/v1/documents';

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (data.context) {
    setContextFilter(data.context);
  }

  setDocuments(data.documents);
};
```

### Backend Implementation
```typescript
// Example: Process context filters
const getDocuments = async (req, res) => {
  let query = db.query('documents');

  // Apply entity context filters
  if (req.query.deal_id) {
    query = query.where('deal_id', req.query.deal_id);
  } else if (req.query.account_id) {
    query = query.where('account_id', req.query.account_id);
  } else if (req.query.contact_id) {
    query = query.whereRaw('? = ANY(contact_ids)', [req.query.contact_id]);
  } else if (req.query.activity_id) {
    query = query.where('activity_id', req.query.activity_id);
  }

  // Apply additional filters
  if (req.query.category) {
    query = query.where('category', req.query.category);
  }
  if (req.query.source) {
    query = query.where('source', req.query.source);
  }

  // Apply search
  if (req.query.search) {
    query = query.whereRaw(`
      document_name ILIKE ? OR
      description ILIKE ? OR
      ? = ANY(tags)
    `, [`%${req.query.search}%`, `%${req.query.search}%`, req.query.search]);
  }

  const documents = await query.execute();

  res.json({
    documents,
    total: documents.length,
    context: buildContext(req.query)
  });
};
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-12 | Initial API documentation with context filtering |

---

## Support

For API support, contact:
- **Email:** api-support@example.com
- **Documentation:** https://docs.example.com/api/documents
- **Status Page:** https://status.example.com

---

**End of API Documentation**
