# Edge Cases Quick Reference
**Context Filtering Error Handling**

**Quick lookup guide for testing and debugging edge cases**

---

## 🚨 6 Edge Cases to Handle

### 1️⃣ **Invalid Context ID**
**URL:** `/documents?deal_id=deal_invalid_999`

**What happens:**
- ⚠️ Red banner: "Deal not found. Showing all documents instead."
- Shows all 247 documents
- URL auto-cleaned to `/documents`

**Status:** `404 Not Found`
**Code:** `CONTEXT_NOT_FOUND`

---

### 2️⃣ **Deleted Deal (Bookmarked)**
**URL:** `/documents?deal_id=deal_deleted_001`

**What happens:**
- ⚠️ Yellow banner: "This deal no longer exists. Showing all documents."
- Context cleared automatically
- Browser history updated

**Status:** `410 Gone`
**Code:** `CONTEXT_DELETED`

---

### 3️⃣ **Multiple Context Parameters**
**URL:** `/documents?deal_id=deal_acme_001&account_id=account_techstart`

**What happens:**
- ℹ️ Blue banner (8s auto-dismiss): "Multiple contexts detected. Using Deal (priority)."
- Shows 6 documents for Acme deal only
- Ignores account_id parameter

**Status:** `200 OK`
**Code:** `MULTIPLE_CONTEXTS_DETECTED`

**Priority:** deal > account > contact > activity

---

### 4️⃣ **Permission Denied**
**URL:** `/documents?deal_id=deal_confidential_001`

**What happens:**
- 🔒 Red banner: "Access denied. You don't have permission to view this deal."
- Shows "Request Access" button
- Shows only accessible documents

**Status:** `403 Forbidden`
**Code:** `PERMISSION_DENIED`

---

### 5️⃣ **Invalid ID Format**
**URL:** `/documents?deal_id=contact_john_smith`

**What happens:**
- ⚠️ Red banner: "Invalid deal ID format. Showing all documents instead."
- Shows all documents
- Console logs format hint

**Status:** `400 Bad Request`
**Code:** `INVALID_CONTEXT_FORMAT`

**Valid patterns:**
- Deal: `deal_[a-z0-9_]+`
- Account: `account_[a-z0-9_]+`
- Contact: `contact_[a-z0-9_]+`
- Activity: `act_[a-z0-9_]+`

---

### 6️⃣ **Valid Context, No Documents**
**URL:** `/documents?deal_id=deal_new_001&deal_name=New%20Deal`

**What happens:**
- ✅ Context banner stays: "New Deal (Deal)"
- 📭 Empty state: "No documents found for this deal"
- 🔵 CTA: "+ Upload Document" (auto-links)
- ❌ NO error banner (this is normal)

**Status:** `200 OK`
**Code:** None (not an error)

---

## 📊 Summary Table

| # | Edge Case | Status | Banner Type | Auto-Clear URL | Fallback |
|---|-----------|--------|-------------|----------------|----------|
| 1 | Invalid ID | 404 | Red | ✅ Yes | All docs |
| 2 | Deleted | 410 | Yellow | ✅ Yes | All docs |
| 3 | Multiple | 200 | Blue (8s) | ❌ No | Primary context |
| 4 | Permission | 403 | Red | ❌ No | Accessible docs |
| 5 | Format | 400 | Red | ✅ Yes | All docs |
| 6 | Empty | 200 | None | ❌ No | Keep context |

---

## 🧪 Test URLs (Copy-Paste)

```bash
# Edge Case 1: Invalid ID
/documents?deal_id=deal_invalid_999&deal_name=Fake%20Deal

# Edge Case 2: Deleted Record
/documents?deal_id=deal_deleted_q1_2020&deal_name=Old%20Deal

# Edge Case 3: Multiple Contexts
/documents?deal_id=deal_acme_001&account_id=account_techstart

# Edge Case 4: Permission Denied (if implemented)
/documents?deal_id=deal_confidential_001

# Edge Case 5: Wrong Prefix
/documents?deal_id=contact_john_smith

# Edge Case 6: Valid but Empty
/documents?deal_id=deal_new_empty_001&deal_name=Empty%20Deal
```

---

## 🎨 Banner Colors

| Type | Color | Auto-Hide | Dismissable | Use Cases |
|------|-------|-----------|-------------|-----------|
| **Error** | Red | ❌ No | ✅ Yes | Invalid, deleted, permission |
| **Warning** | Yellow | ❌ No | ✅ Yes | Soft deletes, deprecations |
| **Info** | Blue | ✅ 8s | ✅ Yes | Multiple contexts, tips |

---

## 🔍 Developer Console

### Edge Case 1-2 (Invalid/Deleted)
```javascript
[Invalid Context] {
  contextType: 'deal',
  errorType: 'not_found',
  message: 'Entity does not exist in database'
}
```

### Edge Case 3 (Multiple)
```javascript
[Context Conflict] {
  contextParams: {deal_id: "deal_acme_001", account_id: "account_techstart"},
  primaryContext: "deal_id",
  ignoredParams: ["account_id"]
}
```

### Edge Case 5 (Format)
```javascript
[Invalid Format] {
  expected: /^deal_[a-z0-9_]+$/i,
  received: "contact_john_smith",
  suggestion: "Use correct entity prefix"
}
```

---

## 📱 User Experience Flow

### Scenario A: Broken Bookmark
```
1. User clicks bookmark: /documents?deal_id=deal_old_001
2. ⏱️ "Validating context..." (0.5s)
3. ⚠️ "This deal no longer exists. Showing all documents."
4. 📄 All 247 documents displayed
5. 🧹 URL cleaned to: /documents
6. User dismisses banner, continues normally
```

### Scenario B: Typo in URL
```
1. User manually types: /documents?deal_id=deal_fake_999
2. ⏱️ "Validating context..." (0.5s)
3. ⚠️ "Deal not found. Showing all documents instead."
4. 📄 All documents shown
5. 🧹 URL cleaned
6. 📊 Error logged to analytics
```

### Scenario C: Multiple Parameters
```
1. User crafts URL with 2 contexts
2. ℹ️ "Multiple contexts detected. Using Deal (priority)."
3. 📄 Shows deal documents only
4. ⏱️ Banner auto-hides after 8 seconds
5. Context correctly applied
```

---

## 🛠️ Implementation Checklist

### Backend
- [ ] Validate context ID exists
- [ ] Check for soft-deleted records
- [ ] Verify user permissions
- [ ] Validate ID format (regex)
- [ ] Return appropriate HTTP status codes
- [ ] Include fallback data in error responses

### Frontend
- [ ] Show loading state during validation
- [ ] Display appropriate banner type
- [ ] Auto-clear invalid URL params
- [ ] Implement banner auto-hide (8s for info)
- [ ] Add dismiss functionality
- [ ] Log errors to console + analytics
- [ ] Handle empty states separately (not errors)

### Testing
- [ ] Test all 6 edge cases manually
- [ ] Verify banner colors and messages
- [ ] Check URL cleanup behavior
- [ ] Test auto-hide timing (8s)
- [ ] Validate console logs
- [ ] Check analytics tracking

---

## 🚀 Quick Test Script

```javascript
// Run this in browser console to test all edge cases

const edgeCases = [
  { name: 'Invalid ID', url: '/documents?deal_id=deal_invalid_999' },
  { name: 'Deleted', url: '/documents?deal_id=deal_deleted_001' },
  { name: 'Multiple', url: '/documents?deal_id=deal_acme_001&account_id=acc_tech' },
  { name: 'Wrong Format', url: '/documents?deal_id=contact_john' },
  { name: 'No Prefix', url: '/documents?deal_id=123' },
  { name: 'Valid Empty', url: '/documents?deal_id=deal_new_001&deal_name=New' }
];

edgeCases.forEach((test, i) => {
  setTimeout(() => {
    console.log(`\n🧪 Testing: ${test.name}`);
    window.location.href = test.url;
  }, i * 15000); // 15s between tests
});
```

---

## 📞 Support

If you encounter an edge case not covered here:
1. Check browser console for error details
2. Verify URL parameter format
3. Check network tab for API response
4. Review `EDGE_CASES_IMPLEMENTATION.md` for full details

---

**Last Updated:** December 12, 2024
**Related Docs:**
- `EDGE_CASES_IMPLEMENTATION.md` (full guide)
- `DOCUMENTS_API_DOCUMENTATION.md` (API reference)
- `CLICKABLE_INTERACTIONS_IMPLEMENTATION.md` (context filtering)
