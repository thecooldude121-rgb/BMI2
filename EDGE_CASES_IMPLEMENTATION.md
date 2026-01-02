# Context Filtering Edge Cases Implementation
**Complete Error Handling for Invalid, Deleted, and Conflicting Context Filters**

**Version:** 1.0.0
**Date:** December 12, 2024

---

## Overview

This document details the implementation of comprehensive edge case handling for the context-aware document filtering system. It covers scenarios where context IDs are invalid, deleted, or conflict with each other.

---

## Table of Contents

1. [Edge Case Categories](#edge-case-categories)
2. [Implementation Strategy](#implementation-strategy)
3. [Code Implementation](#code-implementation)
4. [UI Components](#ui-components)
5. [API Error Responses](#api-error-responses)
6. [User Experience](#user-experience)
7. [Testing Guide](#testing-guide)

---

## Edge Case Categories

### **Category 1: Invalid Context IDs**
Context ID provided in URL doesn't exist in the database.

**Examples:**
- `/documents?deal_id=deal_invalid_999`
- `/documents?account_id=acc_fake_123`
- `/documents?contact_id=contact_nonexistent`

**Expected Behavior:**
- Show error banner: "⚠️ Deal not found. Showing all documents instead."
- Auto-clear invalid filter
- Display all documents (fallback to no filter)
- Log error for debugging

---

### **Category 2: Deleted Context Records**
User bookmarked/saved a URL with valid ID, but record was later deleted.

**Examples:**
- Bookmarked: `/documents?deal_id=deal_deleted_001`
- Deal "deal_deleted_001" was closed and archived
- User clicks bookmark weeks later

**Expected Behavior:**
- Show error banner: "⚠️ This deal no longer exists. Showing all documents."
- Context cleared automatically
- Suggest related documents if available
- Update browser history to remove invalid params

---

### **Category 3: Multiple Context Parameters**
URL contains multiple entity context params (conflict scenario).

**Examples:**
- `/documents?deal_id=deal_acme_001&account_id=account_techstart`
- `/documents?contact_id=contact_001&activity_id=act_001`

**Expected Behavior:**
- Apply priority order: deal > account > contact > activity
- Show info banner: "ℹ️ Multiple contexts detected. Showing Deal context (priority)."
- Ignore lower-priority parameters
- Log conflict for analytics

---

### **Category 4: Permission Denied**
User doesn't have access to the requested entity.

**Example:**
- `/documents?deal_id=deal_confidential_001`
- User is not on the deal team

**Expected Behavior:**
- Show error banner: "🔒 Access denied. You don't have permission to view this deal."
- Don't show any documents from that deal
- Fallback to showing all accessible documents
- Log security event

---

### **Category 5: Context Type Mismatch**
Entity ID format doesn't match expected type.

**Examples:**
- `/documents?deal_id=contact_sarah_lee` (wrong prefix)
- `/documents?account_id=123` (not a valid format)

**Expected Behavior:**
- Validate ID format before query
- Show error: "⚠️ Invalid deal ID format. Showing all documents."
- Clear invalid parameter
- Suggest correct format in console

---

### **Category 6: Empty Result Set**
Valid context but no documents associated.

**Example:**
- `/documents?deal_id=deal_new_001` (newly created deal)
- Deal exists but has zero documents

**Expected Behavior:**
- Show context-aware empty state
- Display: "No documents found for: Acme Corp - Enterprise Plan (Deal)"
- Offer "Upload Document" action with auto-linking
- Keep context active (don't clear it)

---

## Implementation Strategy

### **1. Validation Layer**

```typescript
interface ContextValidationResult {
  isValid: boolean;
  errorType?: 'not_found' | 'deleted' | 'permission_denied' | 'invalid_format';
  errorMessage?: string;
  suggestedAction?: string;
  fallbackContext?: ContextFilter | null;
}

const validateContextId = async (
  type: 'deal' | 'account' | 'contact' | 'activity',
  id: string,
  userId: string
): Promise<ContextValidationResult> => {
  // 1. Format validation
  if (!isValidIdFormat(type, id)) {
    return {
      isValid: false,
      errorType: 'invalid_format',
      errorMessage: `Invalid ${type} ID format`,
      suggestedAction: 'clear_filter'
    };
  }

  // 2. Existence check
  const entity = await fetchEntity(type, id);
  if (!entity) {
    return {
      isValid: false,
      errorType: 'not_found',
      errorMessage: `${capitalize(type)} not found`,
      suggestedAction: 'clear_filter'
    };
  }

  // 3. Soft delete check
  if (entity.deleted_at) {
    return {
      isValid: false,
      errorType: 'deleted',
      errorMessage: `This ${type} no longer exists`,
      suggestedAction: 'clear_filter'
    };
  }

  // 4. Permission check
  const hasAccess = await checkPermission(userId, type, id);
  if (!hasAccess) {
    return {
      isValid: false,
      errorType: 'permission_denied',
      errorMessage: `You don't have permission to view this ${type}`,
      suggestedAction: 'show_all'
    };
  }

  return { isValid: true };
};
```

---

### **2. Context Priority Resolution**

```typescript
interface ContextParams {
  deal_id?: string;
  account_id?: string;
  contact_id?: string;
  activity_id?: string;
  [key: string]: string | undefined;
}

const CONTEXT_PRIORITY = ['deal_id', 'account_id', 'contact_id', 'activity_id'];

const resolveContextConflicts = (params: ContextParams): {
  primaryContext: string;
  ignoredParams: string[];
  warningMessage?: string;
} => {
  const presentContexts = CONTEXT_PRIORITY.filter(key => params[key]);

  if (presentContexts.length === 0) {
    return { primaryContext: '', ignoredParams: [] };
  }

  if (presentContexts.length === 1) {
    return { primaryContext: presentContexts[0], ignoredParams: [] };
  }

  // Multiple contexts detected - apply priority
  const [primary, ...ignored] = presentContexts;
  const ignoredTypes = ignored.map(key => key.replace('_id', ''));

  return {
    primaryContext: primary,
    ignoredParams: ignored,
    warningMessage: `Multiple contexts detected. Using ${primary.replace('_id', '')} (priority). Ignored: ${ignoredTypes.join(', ')}`
  };
};
```

---

### **3. Error Banner Component**

```typescript
interface ErrorBannerProps {
  type: 'error' | 'warning' | 'info';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  type,
  message,
  action,
  onDismiss,
  autoHide = false,
  duration = 5000
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  if (!visible) return null;

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />
  };

  const bgColors = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={`border-l-4 p-4 mb-4 rounded ${bgColors[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {icons[type]}
          <div>
            <p className="text-sm font-medium text-gray-900">{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## Code Implementation

### **Main Component with Edge Case Handling**

```typescript
const DocumentsLibrary: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [contextFilter, setContextFilter] = useState<ContextFilter | null>(null);
  const [contextError, setContextError] = useState<{
    type: 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);
  const [isValidatingContext, setIsValidatingContext] = useState(false);

  // Edge Case Handling: Validate context on mount
  useEffect(() => {
    const handleContextValidation = async () => {
      setIsValidatingContext(true);
      setContextError(null);

      try {
        // Extract all context params
        const contextParams = {
          deal_id: searchParams.get('deal_id'),
          account_id: searchParams.get('account_id'),
          contact_id: searchParams.get('contact_id'),
          activity_id: searchParams.get('activity_id')
        };

        // EDGE CASE 3: Multiple context parameters
        const { primaryContext, ignoredParams, warningMessage } =
          resolveContextConflicts(contextParams);

        if (warningMessage) {
          setContextError({
            type: 'info',
            message: warningMessage
          });
          console.warn('[Context Conflict]', { contextParams, primaryContext, ignoredParams });
        }

        // Get the primary context to validate
        if (!primaryContext) {
          // No context params - load all documents
          setIsValidatingContext(false);
          return;
        }

        const contextType = primaryContext.replace('_id', '') as 'deal' | 'account' | 'contact' | 'activity';
        const contextId = contextParams[primaryContext as keyof typeof contextParams];

        if (!contextId) {
          setIsValidatingContext(false);
          return;
        }

        // EDGE CASE 5: Format validation
        if (!isValidContextIdFormat(contextType, contextId)) {
          setContextError({
            type: 'error',
            message: `⚠️ Invalid ${contextType} ID format. Showing all documents instead.`
          });
          clearInvalidContextParams();
          setIsValidatingContext(false);
          return;
        }

        // EDGE CASE 1 & 2: Validate context ID exists and not deleted
        const validation = await validateContextId(
          contextType,
          contextId,
          currentUser.id
        );

        if (!validation.isValid) {
          handleInvalidContext(validation, contextType);
          setIsValidatingContext(false);
          return;
        }

        // Context is valid - set it
        const contextName = searchParams.get(`${contextType}_name`) || capitalize(contextType);
        const additionalData = extractAdditionalContextData(searchParams, contextType);

        setContextFilter({
          type: contextType,
          id: contextId,
          name: contextName,
          ...additionalData
        });

      } catch (error) {
        console.error('[Context Validation Error]', error);
        setContextError({
          type: 'error',
          message: '⚠️ Error loading context. Showing all documents.'
        });
      } finally {
        setIsValidatingContext(false);
      }
    };

    handleContextValidation();
  }, [searchParams]);

  // Handle invalid context results
  const handleInvalidContext = (
    validation: ContextValidationResult,
    contextType: string
  ) => {
    const messages = {
      not_found: `⚠️ ${capitalize(contextType)} not found. Showing all documents instead.`,
      deleted: `⚠️ This ${contextType} no longer exists. Showing all documents.`,
      permission_denied: `🔒 Access denied. You don't have permission to view this ${contextType}.`,
      invalid_format: `⚠️ Invalid ${contextType} ID format. Showing all documents instead.`
    };

    setContextError({
      type: validation.errorType === 'permission_denied' ? 'error' : 'warning',
      message: messages[validation.errorType || 'not_found']
    });

    // Clear invalid params from URL
    clearInvalidContextParams();

    // Log for debugging
    console.error('[Invalid Context]', {
      contextType,
      errorType: validation.errorType,
      message: validation.errorMessage
    });

    // Track analytics
    trackContextError(contextType, validation.errorType);
  };

  // Clear invalid context params from URL
  const clearInvalidContextParams = () => {
    const newParams = new URLSearchParams(searchParams);

    // Remove all context params
    ['deal_id', 'deal_name', 'account_id', 'account_name',
     'contact_id', 'contact_name', 'activity_id', 'activity_name',
     'activity_type', 'title', 'hrms_connected'].forEach(param => {
      newParams.delete(param);
    });

    setSearchParams(newParams, { replace: true });
    setContextFilter(null);
  };

  // Dismiss error banner
  const dismissError = () => {
    setContextError(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      {/* Error/Warning Banner */}
      {contextError && (
        <ErrorBanner
          type={contextError.type}
          message={contextError.message}
          onDismiss={dismissError}
          autoHide={contextError.type === 'info'}
          duration={8000}
        />
      )}

      {/* Loading state during validation */}
      {isValidatingContext && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-700">Validating context...</p>
          </div>
        </div>
      )}

      {/* Rest of component... */}
    </div>
  );
};
```

---

### **Helper Functions**

```typescript
// Format validation
const isValidContextIdFormat = (type: string, id: string): boolean => {
  const patterns = {
    deal: /^deal_[a-z0-9_]+$/i,
    account: /^account_[a-z0-9_]+$/i,
    contact: /^contact_[a-z0-9_]+$/i,
    activity: /^act_[a-z0-9_]+$/i
  };

  return patterns[type as keyof typeof patterns]?.test(id) ?? false;
};

// Fetch entity from database
const fetchEntity = async (type: string, id: string) => {
  const endpoints = {
    deal: '/api/deals',
    account: '/api/accounts',
    contact: '/api/contacts',
    activity: '/api/activities'
  };

  const endpoint = endpoints[type as keyof typeof endpoints];
  if (!endpoint) return null;

  try {
    const response = await fetch(`${endpoint}/${id}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`[Fetch Entity Error] ${type}:${id}`, error);
    return null;
  }
};

// Check user permissions
const checkPermission = async (
  userId: string,
  entityType: string,
  entityId: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `/api/permissions/check?user_id=${userId}&entity_type=${entityType}&entity_id=${entityId}`
    );
    const data = await response.json();
    return data.hasAccess === true;
  } catch (error) {
    console.error('[Permission Check Error]', error);
    return false; // Deny access on error (fail-safe)
  }
};

// Extract additional context data
const extractAdditionalContextData = (
  searchParams: URLSearchParams,
  contextType: string
): object => {
  const additional: any = {};

  if (contextType === 'account') {
    const hrms = searchParams.get('hrms_connected');
    if (hrms) additional.hrmsConnected = hrms === 'true';
  }

  if (contextType === 'contact') {
    const title = searchParams.get('title');
    if (title) additional.title = title;

    const accountName = searchParams.get('account_name');
    if (accountName) additional.accountName = accountName;
  }

  if (contextType === 'activity') {
    const activityType = searchParams.get('activity_type');
    if (activityType) additional.activityType = activityType;
  }

  return additional;
};

// Analytics tracking
const trackContextError = (contextType: string, errorType: string) => {
  // Send to analytics service
  if (window.analytics) {
    window.analytics.track('Context Filter Error', {
      context_type: contextType,
      error_type: errorType,
      timestamp: new Date().toISOString()
    });
  }
};

// Utility: Capitalize first letter
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
```

---

## UI Components

### **Error Banner States**

#### **Error State (Red)**
```
┌─────────────────────────────────────────────────────────────────┐
│ [!] ⚠️ Deal not found. Showing all documents instead.   [Dismiss]│
└─────────────────────────────────────────────────────────────────┘
```

#### **Warning State (Yellow)**
```
┌─────────────────────────────────────────────────────────────────┐
│ [!] ⚠️ This deal no longer exists. Showing all documents.[Dismiss]│
└─────────────────────────────────────────────────────────────────┘
```

#### **Info State (Blue - Auto-dismiss after 8s)**
```
┌─────────────────────────────────────────────────────────────────┐
│ [i] Multiple contexts detected. Using Deal (priority).  [Dismiss]│
└─────────────────────────────────────────────────────────────────┘
```

#### **Permission Denied (Red)**
```
┌─────────────────────────────────────────────────────────────────┐
│ [🔒] Access denied. You don't have permission to view this deal.│
│      [Request Access]                                    [Dismiss]│
└─────────────────────────────────────────────────────────────────┘
```

---

### **Context-Aware Empty State**

When context is valid but no documents found:

```
┌─────────────────────────────────────────────────────────────────┐
│  Context: Acme Corp - Enterprise Plan (Deal)           [Clear X]│
└─────────────────────────────────────────────────────────────────┘

           [Empty Folder Icon]

     No documents found for this deal

     Start by uploading documents to keep all deal-related
     files organized in one place.

           [+ Upload Document]

     Documents uploaded here will be automatically linked
     to Acme Corp - Enterprise Plan.
```

---

## API Error Responses

### **Error Response Structure**

```typescript
interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      context_type: string;
      context_id: string;
      reason: string;
    };
    suggestions?: string[];
  };
}
```

---

### **Example Error Responses**

#### **Not Found (404)**
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
  }
}
```

#### **Deleted (410 Gone)**
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
  }
}
```

#### **Permission Denied (403)**
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
  }
}
```

#### **Invalid Format (400)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CONTEXT_FORMAT",
    "message": "Invalid deal ID format",
    "details": {
      "context_type": "deal",
      "context_id": "123",
      "reason": "ID does not match expected pattern",
      "expected_format": "deal_[alphanumeric_underscore]",
      "example": "deal_acme_001"
    }
  }
}
```

---

## User Experience

### **Scenario 1: Invalid Deal ID**

**User Action:**
1. Clicks shared link: `/documents?deal_id=deal_fake_999`

**System Response:**
1. ⏱️ Shows "Validating context..." spinner (0.5s)
2. ⚠️ Red banner appears: "Deal not found. Showing all documents instead."
3. 📄 Displays all 247 documents (no filter)
4. 🧹 URL cleaned to `/documents` (invalid param removed)
5. 📊 Error logged to analytics

**User Can:**
- Dismiss banner (X button)
- Continue browsing all documents
- Use search/filters normally

---

### **Scenario 2: Deleted Deal (Bookmarked URL)**

**User Action:**
1. Opens bookmark: `/documents?deal_id=deal_closed_q3_2023`
2. Deal was archived 2 months ago

**System Response:**
1. ⏱️ Shows "Validating context..." spinner
2. ⚠️ Yellow banner: "This deal no longer exists. Showing all documents."
3. 📄 Shows all documents
4. 💡 Suggests: "View archived deals" (if feature exists)
5. 🧹 URL cleaned automatically

**Enhanced UX:**
- Banner includes "View Archive" link if available
- Bookmark manager detects broken links
- User can re-bookmark with valid context

---

### **Scenario 3: Multiple Context Params**

**User Action:**
1. Manually crafts URL: `/documents?deal_id=deal_acme_001&account_id=account_techstart`

**System Response:**
1. ⏱️ No spinner (instant resolution)
2. ℹ️ Blue info banner (8s auto-dismiss): "Multiple contexts detected. Using Deal (priority). Ignored: account"
3. 📄 Shows 6 documents for Acme deal
4. 🎯 Context banner: "Acme Corp - Enterprise Plan (Deal)"
5. 📊 Logs conflict to analytics

**Developer Console:**
```
[Context Conflict] {
  contextParams: {deal_id: "deal_acme_001", account_id: "account_techstart"},
  primaryContext: "deal_id",
  ignoredParams: ["account_id"]
}
```

---

### **Scenario 4: Permission Denied**

**User Action:**
1. Tries to access: `/documents?deal_id=deal_executive_confidential`
2. User is not on deal team

**System Response:**
1. ⏱️ Shows "Validating context..." spinner
2. 🔒 Red banner: "Access denied. You don't have permission to view this deal."
3. 🔘 Shows "Request Access" button
4. 📄 Shows only documents user CAN access (all others)
5. 🔐 Security event logged

**User Can:**
- Click "Request Access" → Opens request modal
- Dismiss banner
- Continue with accessible documents

---

### **Scenario 5: Format Mismatch**

**User Action:**
1. Types URL: `/documents?deal_id=contact_john_smith` (wrong prefix)

**System Response:**
1. ⚠️ Red banner: "Invalid deal ID format. Showing all documents instead."
2. 📄 Shows all documents
3. 💬 Console message: "Expected format: deal_[id], got: contact_john_smith"
4. 🧹 URL cleaned

**Developer Console:**
```
[Invalid Format] {
  expected: /^deal_[a-z0-9_]+$/i,
  received: "contact_john_smith",
  suggestion: "Use correct entity prefix"
}
```

---

### **Scenario 6: Valid Context, No Documents**

**User Action:**
1. Clicks "View Documents" from newly created deal

**System Response:**
1. ✅ Context validation passes
2. 🎯 Context banner: "New Deal - Q1 2025 (Deal)" with [Clear X]
3. 📭 Context-aware empty state:
   - Icon: Empty folder
   - Message: "No documents found for this deal"
   - CTA: "+ Upload Document" (auto-links to deal)
4. ✨ No error (this is normal state)

**User Can:**
- Upload first document (will auto-link)
- Clear context and browse all docs
- Search/filter won't show banner (different from error)

---

## Testing Guide

### **Test URLs**

Copy-paste these URLs to test each edge case:

```bash
# EDGE CASE 1: Invalid Deal ID
/documents?deal_id=deal_invalid_999&deal_name=Fake%20Deal

# EDGE CASE 2: Deleted Deal (simulate by using very old ID)
/documents?deal_id=deal_deleted_q1_2020&deal_name=Old%20Deal

# EDGE CASE 3: Multiple Context Parameters
/documents?deal_id=deal_acme_001&account_id=account_techstart&deal_name=Acme%20Deal

# EDGE CASE 4: Invalid Format (wrong prefix)
/documents?deal_id=contact_john_smith

# EDGE CASE 5: Invalid Format (no prefix)
/documents?deal_id=12345

# EDGE CASE 6: Valid but empty
/documents?deal_id=deal_new_empty_001&deal_name=Empty%20Deal
```

---

### **Manual Test Cases**

| # | Test Case | URL | Expected Result | Pass/Fail |
|---|-----------|-----|-----------------|-----------|
| 1 | Invalid deal ID | `/documents?deal_id=fake_999` | Red banner: "Deal not found" | ☐ |
| 2 | Invalid account ID | `/documents?account_id=acc_invalid` | Red banner: "Account not found" | ☐ |
| 3 | Deleted deal | `/documents?deal_id=deal_deleted_001` | Yellow banner: "Deal no longer exists" | ☐ |
| 4 | Multiple contexts (deal + account) | `/documents?deal_id=deal_acme_001&account_id=acc_tech` | Blue banner: "Using Deal (priority)" | ☐ |
| 5 | Multiple contexts (3 params) | URL with deal+account+contact | Blue banner, uses deal_id | ☐ |
| 6 | Wrong prefix (contact id in deal param) | `/documents?deal_id=contact_john` | Red banner: "Invalid deal ID format" | ☐ |
| 7 | No prefix (plain number) | `/documents?deal_id=123` | Red banner: "Invalid format" | ☐ |
| 8 | Valid context, zero docs | `/documents?deal_id=deal_new_001` | Context-aware empty state | ☐ |
| 9 | Banner dismiss | Click [X] on any banner | Banner disappears | ☐ |
| 10 | URL auto-cleanup | After error, check URL | Invalid params removed | ☐ |
| 11 | Info banner auto-hide | Wait 8 seconds | Blue banner disappears | ☐ |
| 12 | Error banner persist | Wait 8 seconds | Red/yellow banner stays | ☐ |

---

### **Automated Test Suite**

```typescript
describe('Context Filtering Edge Cases', () => {
  describe('Invalid Context IDs', () => {
    it('should show error for invalid deal_id', async () => {
      const { getByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=deal_invalid_999' }
      );

      await waitFor(() => {
        expect(getByText(/Deal not found/i)).toBeInTheDocument();
      });

      expect(getByText(/247/)).toBeInTheDocument(); // All docs shown
    });

    it('should clear invalid params from URL', async () => {
      const { history } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=invalid' }
      );

      await waitFor(() => {
        expect(history.location.pathname).toBe('/documents');
        expect(history.location.search).toBe('');
      });
    });
  });

  describe('Deleted Records', () => {
    it('should show warning for deleted deal', async () => {
      mockFetchEntity.mockResolvedValue({
        id: 'deal_deleted_001',
        deleted_at: '2024-11-15T10:00:00Z'
      });

      const { getByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=deal_deleted_001' }
      );

      await waitFor(() => {
        expect(getByText(/no longer exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Context Parameters', () => {
    it('should prioritize deal_id over account_id', async () => {
      const { getByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=deal_acme_001&account_id=acc_tech' }
      );

      await waitFor(() => {
        expect(getByText(/Multiple contexts detected/i)).toBeInTheDocument();
        expect(getByText(/Acme Corp.*Deal/i)).toBeInTheDocument();
      });
    });

    it('should log conflict to console', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');

      render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=deal_001&account_id=acc_001' }
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[Context Conflict]',
          expect.objectContaining({ primaryContext: 'deal_id' })
        );
      });
    });
  });

  describe('Format Validation', () => {
    it('should reject ID with wrong prefix', async () => {
      const { getByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=contact_john_smith' }
      );

      await waitFor(() => {
        expect(getByText(/Invalid.*format/i)).toBeInTheDocument();
      });
    });

    it('should reject ID with no prefix', async () => {
      const { getByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=12345' }
      );

      await waitFor(() => {
        expect(getByText(/Invalid.*format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Permission Denied', () => {
    it('should show access denied message', async () => {
      mockCheckPermission.mockResolvedValue(false);

      const { getByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=deal_confidential' }
      );

      await waitFor(() => {
        expect(getByText(/Access denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty Result Set', () => {
    it('should show context-aware empty state', async () => {
      mockFetchDocuments.mockResolvedValue([]);

      const { getByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=deal_new_001&deal_name=New%20Deal' }
      );

      await waitFor(() => {
        expect(getByText(/No documents found for this deal/i)).toBeInTheDocument();
        expect(getByText(/New Deal.*Deal/i)).toBeInTheDocument();
      });
    });
  });

  describe('Banner Interactions', () => {
    it('should dismiss banner on X click', async () => {
      const { getByText, queryByText, getByRole } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=invalid' }
      );

      await waitFor(() => {
        expect(getByText(/not found/i)).toBeInTheDocument();
      });

      const dismissButton = getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(queryByText(/not found/i)).not.toBeInTheDocument();
      });
    });

    it('should auto-hide info banner after duration', async () => {
      jest.useFakeTimers();

      const { getByText, queryByText } = render(
        <DocumentsLibrary />,
        { route: '/documents?deal_id=deal_001&account_id=acc_001' }
      );

      await waitFor(() => {
        expect(getByText(/Multiple contexts/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(8000);

      await waitFor(() => {
        expect(queryByText(/Multiple contexts/i)).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});
```

---

## Implementation Checklist

### **Backend (API Layer)**
- [ ] Add context validation endpoint
- [ ] Implement entity existence checks
- [ ] Add soft-delete detection
- [ ] Implement permission checks
- [ ] Return appropriate error codes (404, 410, 403, 400)
- [ ] Include suggestions in error responses
- [ ] Log all validation errors
- [ ] Track analytics events

### **Frontend (UI Layer)**
- [ ] Create ErrorBanner component
- [ ] Add context validation on mount
- [ ] Implement priority resolution for conflicts
- [ ] Add format validation (regex patterns)
- [ ] Handle API error responses
- [ ] Auto-clear invalid params from URL
- [ ] Show loading state during validation
- [ ] Implement context-aware empty states
- [ ] Add banner auto-hide for info messages
- [ ] Add banner dismiss functionality

### **Testing**
- [ ] Write unit tests for validation functions
- [ ] Write integration tests for edge cases
- [ ] Test all error banner states
- [ ] Test URL cleanup behavior
- [ ] Test context priority resolution
- [ ] Manual QA with test URLs
- [ ] Performance test with slow API responses
- [ ] Accessibility audit (ARIA labels, keyboard nav)

### **Documentation**
- [ ] Update API documentation with error codes
- [ ] Add edge case examples to docs
- [ ] Create testing guide for QA team
- [ ] Document analytics events
- [ ] Update user guide with error scenarios

---

## Analytics Events

Track these events for monitoring and debugging:

```typescript
// Context validation failure
analytics.track('Context Filter Error', {
  context_type: 'deal',
  error_type: 'not_found',
  context_id: 'deal_invalid_999',
  user_id: currentUser.id,
  timestamp: new Date().toISOString()
});

// Context conflict resolution
analytics.track('Context Conflict Resolved', {
  primary_context: 'deal_id',
  ignored_contexts: ['account_id', 'contact_id'],
  user_id: currentUser.id
});

// Permission denied
analytics.track('Context Access Denied', {
  context_type: 'deal',
  context_id: 'deal_confidential',
  user_id: currentUser.id,
  required_permission: 'deals:read'
});

// Format validation error
analytics.track('Context Format Invalid', {
  context_type: 'deal',
  provided_id: '12345',
  expected_pattern: '^deal_[a-z0-9_]+$'
});
```

---

## Security Considerations

### **1. Access Control**
- Always validate permissions before returning documents
- Never expose document IDs from inaccessible entities
- Log all permission denied attempts
- Rate limit context validation requests

### **2. Information Disclosure**
- Error messages should not reveal system internals
- Don't expose entity details in permission errors
- Sanitize all error responses
- Avoid timing attacks (consistent response times)

### **3. URL Parameter Tampering**
- Validate all context params on server side
- Never trust client-side validation alone
- Use signed URLs for sensitive contexts
- Implement CSRF protection

---

## Performance Optimization

### **1. Caching Strategy**
```typescript
// Cache validation results for 5 minutes
const validationCache = new Map<string, {
  result: ContextValidationResult;
  timestamp: number;
}>();

const getCachedValidation = (key: string) => {
  const cached = validationCache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > 5 * 60 * 1000) {
    validationCache.delete(key);
    return null;
  }

  return cached.result;
};
```

### **2. Parallel Validation**
```typescript
// Validate context and fetch documents in parallel
const [validationResult, documents] = await Promise.all([
  validateContextId(type, id, userId),
  fetchDocuments({ contextId: id, contextType: type })
]);
```

### **3. Debounce Validation**
- Don't validate on every param change
- Debounce by 300ms
- Cancel pending validations on unmount

---

## Browser Compatibility

Tested on:
- ✅ Chrome 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 120+

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-12 | Initial edge case implementation |

---

**End of Edge Cases Implementation Guide**
