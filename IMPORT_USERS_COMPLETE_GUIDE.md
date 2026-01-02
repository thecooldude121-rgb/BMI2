# Import Users - Complete Implementation Guide

## Overview
The Import Users feature allows bulk importing of team members via CSV file upload with comprehensive validation, duplicate detection, and seat availability checking.

## Location
- **Component**: `/src/components/Team/ImportUsersModal.tsx`
- **Integration**: `/src/pages/CRM/TeamManagementPage.tsx`
- **Access**: Team Management page → "Import Users" button

## Three-Step Import Process

### STEP 1: Download Template
**Purpose**: Provide users with the correct CSV format

**Features**:
- One-click template download
- Pre-filled with sample data
- Lists all required and optional fields
- Clear field descriptions

**Template Columns**:
1. **Full Name** (required) - User's complete name
2. **Email** (required, unique) - Valid email address
3. **Phone** (optional) - Contact number
4. **Role** (required) - Must be one of: sales_rep, account_executive, sales_manager, team_lead, director
5. **Department** (required) - User's department
6. **Manager Email** (optional) - Email of reporting manager
7. **Team** (optional) - Territory/team assignment
8. **Status** (required) - Either 'active' or 'inactive'

**Sample Template Content**:
```csv
Full Name,Email,Phone,Role,Department,Manager Email,Team,Status
John Doe,john.doe@company.com,+1 (555) 123-4567,sales_rep,Sales,manager@company.com,West Coast,active
Jane Smith,jane.smith@company.com,+1 (555) 234-5678,account_executive,Sales,,East Coast,active
Bob Johnson,bob.j@company.com,+1 (555) 345-6789,sales_manager,Sales,,Enterprise,active
```

### STEP 2: Upload File
**Purpose**: Accept and parse CSV file

**Features**:
- Drag & drop support
- File browser fallback
- Real-time validation
- File size and format checks

**Constraints**:
- **Format**: CSV files only (.csv)
- **Max Size**: 5MB
- **Max Rows**: 100 users per import
- **Encoding**: UTF-8

**Upload Methods**:
1. **Drag & Drop**: Drag CSV file into the upload zone
2. **Click to Browse**: Click "Choose File" button and select file

**Visual Feedback**:
- Blue border when dragging over drop zone
- File name displayed after selection
- Processing spinner during parse
- Error alert for invalid files

### STEP 3: Review & Import
**Purpose**: Validate data and preview results before import

**Validation Categories**:

#### ✅ Valid Users
- All required fields present
- Email format valid
- Role is recognized
- No duplicates
- Ready to import

#### ⚠️ Warnings (Non-blocking)
- **Duplicate Emails**: Email already exists in system
- **Action**: These users will be skipped during import
- Users can still proceed with import

#### ❌ Errors (Blocking)
- **Missing Required Fields**: Name, email, role, or department missing
- **Invalid Email Format**: Email doesn't match pattern
- **Invalid Role**: Role not in allowed list
- **Action**: Must fix errors and re-upload

#### 🔢 Seat Check
- **Current Usage**: Shows X/Y seats used
- **After Import**: Calculates new total
- **Validation**: Blocks import if over limit
- **Action Required**: Upgrade plan or reduce active users

## Validation Rules

### Required Field Validation
```typescript
- Full Name: Must not be empty
- Email: Must not be empty AND valid format
- Role: Must not be empty AND valid role
- Department: Must not be empty
```

### Email Format Validation
```typescript
Pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
Example Valid: user@company.com
Example Invalid: user@company, @company.com, user@
```

### Role Validation
**Valid Roles**:
- `sales_rep` → Sales Representative
- `account_executive` → Account Executive
- `sales_manager` → Sales Manager
- `team_lead` → Team Lead
- `director` → Director

**Case Insensitive**: Automatically converts to lowercase

### Status Validation
**Valid Values**: `active` or `inactive`
**Default**: If invalid or missing, defaults to `active`

### Duplicate Detection
- Compares against existing team members
- Case-insensitive email matching
- Marks as warning, not error
- Automatically skipped during import

## Seat Availability Check

### Logic
```typescript
Current Active: Count of members with status === 'active'
Seats Available: Total Seats - Current Active
Users to Import: Count of CSV users with status === 'active'

if (Users to Import > Seats Available) {
  BLOCK IMPORT
  Show warning message
} else {
  ALLOW IMPORT
}
```

### Over-Limit Handling
When trying to import more active users than available seats:

**Message Shown**:
```
⚠️ Over limit! Action required:
Upgrade plan or reduce import to X active users
```

**User Options**:
1. Upgrade to larger plan
2. Change some users to 'inactive' in CSV
3. Import fewer users

**Import Button**: Disabled (grayed out) when over limit

## Import Process

### On Import Click
1. **Convert to TeamMember Format**
   - Generate unique IDs
   - Map role to title
   - Create avatars from initials
   - Set joined date to today
   - Add default values

2. **Add to Team List**
   - Append to existing members
   - Maintain state
   - Trigger re-render

3. **Show Success Toast**
   - Count of imported users
   - Count of skipped duplicates
   - Count of errors (if any)

### Success Message Format
```
"8 team members imported successfully.
 2 duplicates skipped. 1 error (see import log)."
```

### Post-Import
- Modal closes automatically
- Team list updates with new members
- Toast notification displayed
- Import log available (future)

## Testing Scenarios

### Scenario 1: Perfect CSV (No Errors)
**Setup**: Valid CSV with 3 unique users, seats available

1. Click "Import Users"
2. Download template
3. Upload valid CSV file
4. **Expected Results**:
   - ✅ 3 valid users
   - ⚠️ 0 warnings
   - ❌ 0 errors
   - ✅ Seat check passed
5. Click "Import 3 Valid Users"
6. **Success**: All 3 users added, toast shows "3 team members imported successfully"

### Scenario 2: Duplicate Emails
**Setup**: CSV with 5 users, 2 emails already exist

1. Upload CSV
2. **Expected Results**:
   - ✅ 3 valid users
   - ⚠️ 2 warnings (duplicate emails)
   - ❌ 0 errors
   - ✅ Seat check passed
3. Click "Import 3 Valid Users"
4. **Success**: 3 new users added, toast shows "3 team members imported successfully. 2 duplicates skipped."

### Scenario 3: Validation Errors
**Setup**: CSV with invalid data (missing name, bad email, invalid role)

1. Upload CSV
2. **Expected Results**:
   - ✅ 5 valid users
   - ⚠️ 0 warnings
   - ❌ 3 errors
     - Row 2: Full Name is required
     - Row 4: Invalid email format
     - Row 7: Invalid role "SuperAdmin"
   - Action required: Fix and re-upload
3. **Cannot Import**: Must fix errors first
4. Click "Fix Errors" to reset and upload corrected file

### Scenario 4: Over Seat Limit
**Setup**: 3/5 seats used, trying to import 5 active users

1. Upload CSV with 5 active users
2. **Expected Results**:
   - ✅ 5 valid users
   - ⚠️ 0 warnings
   - ❌ 0 errors
   - ❌ Seat check FAILED
     - Current: 3/5 seats used
     - After import: 8/5 (over limit)
     - Action required: Upgrade or reduce to 2 users
3. **Import Button**: Disabled
4. User must either:
   - Upgrade plan to get more seats
   - Edit CSV to have only 2 active users
   - Change 3 users to 'inactive' status

### Scenario 5: Mix of Active and Inactive
**Setup**: CSV with 5 users: 2 active, 3 inactive

1. Upload CSV
2. **Expected Results**:
   - ✅ 5 valid users
   - Seat check: Only 2 active users count toward limit
3. **Success**: All 5 imported, only 2 consume seats

### Scenario 6: Large File Validation
**Setup**: CSV with 150 rows

1. Upload CSV
2. **Expected Error**: Alert "Maximum 100 users per import"
3. File rejected
4. Must split into multiple files

### Scenario 7: Wrong File Format
**Setup**: Upload .xlsx or .txt file

1. Try to upload
2. **Expected Error**: Alert "Please upload a CSV file"
3. File rejected
4. Must convert to CSV first

### Scenario 8: File Too Large
**Setup**: CSV file over 5MB

1. Try to upload
2. **Expected Error**: Alert "File size exceeds 5MB limit"
3. File rejected
4. Must reduce file size

## Button States

### Step 1: Download Template
- **Always Enabled**: Blue button
- **Action**: Downloads CSV template
- **No Prerequisites**: Available immediately

### Step 2: Choose File
- **Always Enabled**: Gray button
- **Action**: Opens file picker
- **No Prerequisites**: Available immediately

### Step 3: Import Buttons

#### Cancel Button
- **Always Enabled**: Gray button
- **Action**: Closes modal, resets state
- **Available**: At all times

#### Fix Errors Button
- **Condition**: Shown only when errors exist
- **Color**: Yellow/Warning
- **Action**: Resets upload, allows re-upload
- **Text**: "Fix Errors"

#### Import Valid Users Button
- **Condition**: Shown only when valid users exist
- **Enabled**: Only if seat check passes AND no blocking errors
- **Disabled**: If over seat limit
- **Color**: Blue when enabled, Gray when disabled
- **Text**: "Import X Valid Users" (X = count)

## Visual Design

### Modal Layout
- **Width**: 768px (max-w-3xl)
- **Max Height**: Calc(100vh - 200px) with scroll
- **Sections**: Three clearly labeled steps
- **Padding**: 24px (px-6 py-6)

### Color Coding
- **Valid Users**: Green (#10B981)
- **Warnings**: Yellow (#F59E0B)
- **Errors**: Red (#EF4444)
- **Seat Check Pass**: Green background
- **Seat Check Fail**: Red background
- **Primary Action**: Blue (#2563EB)

### Icons Used
- **Download**: Download icon (Step 1)
- **Upload**: FileText icon (Step 2)
- **Valid**: CheckCircle icon (green)
- **Warning**: AlertTriangle icon (yellow)
- **Error**: AlertCircle icon (red)

### Status Boxes
Each validation result has a bordered, colored box:
- **Header**: Bold count + icon
- **Content**: Scrollable list (max-h-40)
- **Footer**: Action note in italic

## User Flow Diagram

```
[Team Management Page]
         ↓
    Click "Import Users"
         ↓
[Modal Opens - Step 1]
         ↓
    Download Template (optional)
         ↓
[Step 2: Upload]
         ↓
    Drag & Drop or Choose File
         ↓
   File Processing (spinner)
         ↓
[Step 3: Review]
         ↓
    Validation Results Shown:
    - Valid count (green)
    - Warnings count (yellow)
    - Errors count (red)
    - Seat availability check
         ↓
    Decision:
         ↓
   Errors? → Fix Errors → Re-upload
         ↓
   No errors? → Check Seats
         ↓
   Over limit? → Cannot import (upgrade or reduce)
         ↓
   Under limit? → "Import Valid Users" enabled
         ↓
    Click Import
         ↓
    Users Added to Team
         ↓
    Success Toast
         ↓
    Modal Closes
         ↓
[Team Management Page - Updated List]
```

## Error Messages Reference

### Upload Errors
- "Please upload a CSV file" - Wrong file extension
- "File size exceeds 5MB limit" - File too large
- "Maximum 100 users per import" - Too many rows
- "Error parsing CSV file. Please check the format." - Malformed CSV

### Validation Errors
- "Full Name is required" - Row missing name
- "Email is required" - Row missing email
- "Invalid email format" - Email doesn't match regex
- "Role is required" - Row missing role
- "Invalid role '[role]'. Valid roles: [list]" - Unrecognized role
- "Department is required" - Row missing department

### Warnings
- "Email [email] already exists in the system" - Duplicate email

### Seat Check Errors
- "Not enough seats available. You have X seats but trying to import Y active users. Please upgrade your plan or reduce the number of active users."

## CSV Parsing Logic

### Header Detection
- First row treated as headers
- Supports both formats:
  - "Full Name" OR "name"
  - "Email" OR "email"
  - Case insensitive matching

### Value Parsing
- Splits by comma delimiter
- Trims whitespace
- Empty values converted to empty string
- Handles quoted values

### Row Processing
- Skips empty lines
- Processes row-by-row
- Tracks row numbers for error reporting
- Row numbers start at 2 (accounting for header)

## Keyboard Shortcuts

### Modal
- **Escape**: Close modal
- **Enter**: Not implemented (avoid accidental submits)

### File Input
- **Space/Enter**: Open file picker (when focused)

## Accessibility

### Screen Reader Support
- Modal has proper aria labels
- File input has descriptive text
- Error/warning lists are readable
- Button states announced

### Focus Management
- Modal traps focus
- First focusable element: Close button
- Tab order: Close → Download → Upload → Import buttons

### Visual Indicators
- Sufficient color contrast
- Icons complement text (not only indicator)
- Disabled states clearly visible
- Error messages descriptive

## Performance Considerations

### File Size Limit: 5MB
**Reason**: Prevent browser memory issues

### Row Limit: 100 Users
**Reason**:
- Manageable validation time
- Prevents UI lag
- Reasonable batch size

### Parsing Strategy
- Synchronous parsing (fast for 100 rows)
- No worker threads needed
- Processes in < 1 second

### Memory Management
- File read once
- Results cached in state
- No memory leaks on modal close

## Integration Points

### TeamManagementPage Props
```typescript
<ImportUsersModal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  onImport={handleImportUsers}
  existingMembers={teamMembers}
  totalSeats={totalSeats}
  usedSeats={activeMembers}
/>
```

### Import Handler
```typescript
const handleImportUsers = (users: Partial<TeamMember>[]) => {
  // Convert to full TeamMember objects
  // Add to team list
  // Show success toast with counts
};
```

### State Management
```typescript
const [showImportModal, setShowImportModal] = useState(false);
```

## Future Enhancements

### Import Log Download
- CSV file with import results
- Lists all actions taken
- Includes errors and warnings
- Downloadable from success toast

### Advanced Validation
- Phone number format validation
- Manager email must exist in system
- Custom field validation
- Company-specific rules

### Preview Before Import
- Editable table view
- Fix errors inline
- Remove specific rows
- Reorder users

### Bulk Operations
- Import history tracking
- Rollback capability
- Scheduled imports
- Auto-import from HRMS

### Template Customization
- Custom fields in template
- Multiple template versions
- Field mapping interface
- Save custom mappings

## Quick Reference Card

| Step | Action | Result |
|------|--------|--------|
| 1 | Click "Import Users" | Modal opens |
| 2 | Click "Download CSV Template" | Template file downloads |
| 3 | Fill CSV with user data | Data ready to import |
| 4 | Drag CSV into drop zone | File uploads and validates |
| 5 | Review validation results | See valid, warnings, errors |
| 6 | Fix errors (if any) | Upload corrected file |
| 7 | Verify seat check | Ensure under limit |
| 8 | Click "Import Valid Users" | Users added to team |
| 9 | See success toast | Confirmation with counts |

## Troubleshooting

### Modal Won't Open
- Check: Import Users button clickable?
- Check: No console errors?
- Verify: showImportModal state updates

### File Upload Fails
- Check: File is .csv extension
- Check: File under 5MB
- Check: Valid CSV format
- Try: Open in text editor to verify

### All Users Show as Errors
- Check: CSV has header row
- Check: Header columns match template
- Verify: No special characters in file

### Valid Users Can't Import
- Check: Seat availability
- Verify: Active members count
- Check: Import button enabled state

### Success Toast Doesn't Show
- Verify: onImport handler called
- Check: Toast context available
- Check: Browser console for errors

## Best Practices

### For Users
1. Always download template first
2. Don't modify header row
3. Keep rows under 100
4. Use text editor to verify format
5. Check seat availability before importing

### For Developers
1. Validate on both client and server
2. Log all import attempts
3. Provide detailed error messages
4. Track import success rate
5. Monitor file upload performance

## Support Information

### Common User Questions

**Q: Can I import more than 100 users?**
A: Split into multiple CSV files of 100 users each

**Q: What if I have duplicate emails?**
A: Duplicates are skipped automatically, valid users still imported

**Q: Can I import inactive users?**
A: Yes, inactive users don't count toward seat limit

**Q: What happens if I'm over my seat limit?**
A: Import is blocked until you upgrade or reduce active users

**Q: Can I edit users after import?**
A: Yes, edit individually from team member list

## Build Status
✅ Build successful
✅ All components integrated
✅ No TypeScript errors
✅ Ready for production deployment
