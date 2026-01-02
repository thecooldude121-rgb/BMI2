# Email Composer Modal - Visual Guide

## 📧 Full Modal Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Send Email to Sarah Chen                                       [X] │
│  To: sarah@bmi.com                                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  From                                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ john.smith@company.com                        [Read-Only]    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  To                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ sarah@bmi.com                                 [Read-Only]    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  CC (optional)                                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Add CC recipients...                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  BCC (optional)                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Add BCC recipients...                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ✨ Template                                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ None (blank email)                                        ▼ │  │
│  │   - None (blank email)                                       │  │
│  │   - General Follow-up                                        │  │
│  │   - Meeting Request                                          │  │
│  │   - Performance Check-in                                     │  │
│  │   - Resource Sharing                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Subject                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Enter email subject...                                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Message                                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Hi Sarah,                                                    │  │
│  │                                                              │  │
│  │ [Compose message]                                            │  │
│  │                                                              │  │
│  │ Best regards                                                 │  │
│  │                                                              │  │
│  │                                                              │  │
│  │                                                              │  │
│  │                                                              │  │
│  │                                                              │  │
│  │                                                              │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Attachments                                                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 📎 proposal.pdf                                          [X] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 📎 Add Files                                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
├──────────────────────────────────────────────────────────────────────┤
│  [E] to open email composer                                          │
│                        [Cancel]  [💾 Save as Draft]  [✈️ Send Email] │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Color & Style Guide

### Modal Container
```
Background: White (bg-white)
Border Radius: xl (rounded-xl)
Shadow: 2xl (shadow-2xl)
Max Width: 4xl (896px)
Max Height: 90vh
Z-Index: 50
```

### Header Section
```
Background: White
Border Bottom: slate-200
Padding: 6 (24px)
Title: 2xl font-bold slate-900
Subtitle: sm text slate-600
```

### Input Fields

**Standard Input:**
```
Border: slate-300
Border Radius: lg (rounded-lg)
Padding: 4 (16px)
Focus Ring: 2px blue-500
```

**Disabled/Read-Only:**
```
Background: slate-50
Text: slate-600
Cursor: not-allowed
Border: slate-300
```

**Textarea:**
```
Rows: 12
Font: mono (monospace)
Resize: none
Same styling as input
```

### Buttons

**Primary (Send Email):**
```
Background: blue-600
Text: white
Hover: blue-700
Disabled: slate-300
Icon: Send (✈️)
```

**Secondary (Save as Draft):**
```
Background: blue-50
Text: blue-700
Border: blue-200
Hover: blue-100
Disabled: slate-100
Icon: Save (💾)
```

**Tertiary (Cancel):**
```
Background: white
Text: slate-700
Border: slate-300
Hover: slate-50
```

### Template Dropdown
```
Background: white
Border: slate-300
Icon: Sparkles (✨) in label
Full width select
Options: 5 templates
```

### Attachments

**Attachment Item:**
```
Background: slate-50
Border: slate-200
Padding: 2 (8px) 3 (12px)
Border Radius: lg
Icon: Paperclip (📎)
Remove Button: X (text-slate-400 hover:text-red-600)
```

**Add Files Button:**
```
Background: white
Border: slate-300
Hover: slate-50
Cursor: pointer
Icon: Paperclip (📎)
```

---

## 📱 Responsive Breakpoints

### Desktop (≥1024px)
```
Modal: max-w-4xl (896px)
Padding: 6 (24px)
All fields: full width
Buttons: inline (flex row)
```

### Tablet (768px - 1023px)
```
Modal: max-w-3xl (768px)
Padding: 6 (24px)
All fields: full width
Buttons: inline (flex row)
```

### Mobile (<768px)
```
Modal: Full screen with 4 (16px) margin
Padding: 4 (16px)
All fields: full width
Buttons: may stack on very small screens
```

---

## 🎬 State Variations

### 1. Empty State (Default)
```
Subject: Empty
Body: Empty with placeholder
Attachments: None
Buttons: Save and Send DISABLED (gray)
Template: "None (blank email)"
```

### 2. Template Applied
```
Subject: Filled from template
Body: Filled from template
Attachments: None
Buttons: Save and Send ENABLED (blue)
Template: Selected template name
```

### 3. With Content
```
Subject: User-entered text
Body: User-entered text
Attachments: Optional files
Buttons: Save and Send ENABLED (blue)
```

### 4. Loading (Sending)
```
Send Button:
  ┌─────────────────────────────┐
  │  [spinner] Sending...      │
  └─────────────────────────────┘

Disabled: true
Animation: Spinning circle
```

### 5. Loading (Saving Draft)
```
Save Button:
  ┌─────────────────────────────┐
  │  [spinner] Saving...       │
  └─────────────────────────────┘

Disabled: true
Animation: Spinning circle
```

### 6. With Attachments
```
Attachments:
  ┌────────────────────────────────┐
  │ 📎 proposal.pdf           [X] │
  └────────────────────────────────┘
  ┌────────────────────────────────┐
  │ 📎 budget.xlsx            [X] │
  └────────────────────────────────┘
  ┌────────────────────────────────┐
  │ 📎 Add Files                   │
  └────────────────────────────────┘
```

---

## 🎯 Interactive Elements

### Hover States

**Buttons:**
- Cancel: bg-slate-50
- Save as Draft: bg-blue-100
- Send Email: bg-blue-700
- Close (X): bg-slate-100

**Remove Attachment:**
- Default: text-slate-400
- Hover: text-red-600

**Template Sparkles Icon:**
- Color: blue-600
- Size: w-4 h-4

### Focus States

**All Inputs:**
```
outline: none
ring: 2px solid blue-500
ring-offset: 0
```

**Buttons:**
```
outline: none
ring: 2px solid [button-color]-500
```

### Disabled States

**Buttons:**
```
background: slate-300
cursor: not-allowed
opacity: implicit
text: slate-500
```

**Read-Only Fields:**
```
background: slate-50
cursor: not-allowed
text: slate-600
```

---

## 📋 Template Previews

### 1. None (blank email)
```
Subject: [empty]
Body: [empty]
```

### 2. General Follow-up
```
Subject: Follow-up - Sarah Chen

Body:
Hi Sarah,

I wanted to follow up with you on our recent discussion. Please let me
know if you have any questions or need any support.

Best regards
```

### 3. Meeting Request
```
Subject: Meeting Request - Sarah Chen

Body:
Hi Sarah,

I'd like to schedule some time to meet with you. Would you be available
for a brief meeting this week?

Please let me know what works best for your schedule.

Best regards
```

### 4. Performance Check-in
```
Subject: Performance Check-in - Sarah Chen

Body:
Hi Sarah,

I wanted to reach out to discuss your recent performance and progress.
You've been doing great work, and I'd like to talk about your goals and
any support you might need.

Let me know a good time to connect.

Best regards
```

### 5. Resource Sharing
```
Subject: Resource Sharing - Sarah Chen

Body:
Hi Sarah,

I wanted to share some resources that I think will be helpful for you.
Please take a look when you have a chance.

Let me know if you have any questions!

Best regards
```

---

## ⚡ Animation & Transitions

### Modal Open
```
Animation: Fade in
Duration: 150ms
Backdrop: Fade in black/50
Modal: Scale from 95% to 100%
```

### Modal Close
```
Animation: Fade out
Duration: 100ms
Backdrop: Fade out
Modal: Scale from 100% to 95%
```

### Button Loading
```
Spinner: Rotating circle
Border: 2px
Color: White (on blue) or blue-600 (on white)
Animation: Continuous spin
Speed: 1s per rotation
```

### Toast Notification
```
Position: Top right
Animation: Slide in from right
Duration: Show for 3s
Type: Success (green checkmark)
Message: "Email sent to Sarah Chen"
```

---

## 🔤 Typography

### Modal Title
```
Font Size: 2xl (24px)
Font Weight: bold (700)
Color: slate-900
Line Height: tight
```

### Subtitle (To: email)
```
Font Size: sm (14px)
Font Weight: medium (500)
Color: slate-600
Margin Top: 1 (4px)
```

### Labels
```
Font Size: sm (14px)
Font Weight: medium (500)
Color: slate-700
Margin Bottom: 2 (8px)
Display: block
```

### Input Text
```
Font Size: base (16px)
Font Weight: normal (400)
Color: slate-900
```

### Placeholder
```
Font Size: base (16px)
Font Weight: normal (400)
Color: slate-400
```

### Message Body
```
Font Family: mono (monospace)
Font Size: sm (14px)
Font Weight: normal (400)
Color: slate-900
Line Height: relaxed
```

### Button Text
```
Font Size: base (16px)
Font Weight: medium (500)
Color: white (primary) or slate-700 (secondary)
```

### Footer Hint
```
Font Size: sm (14px)
Font Weight: normal (400)
Color: slate-600
KBD Tag: px-2 py-1 bg-white border
```

---

## 🎨 Iconography

### Icons Used

**Header:**
- ❌ X (Close) - lucide-react

**Template:**
- ✨ Sparkles - lucide-react

**Actions:**
- 📎 Paperclip (Attach) - lucide-react
- 💾 Save (Draft) - lucide-react
- ✈️ Send (Email) - lucide-react

**Attachments:**
- 📎 Paperclip (File) - lucide-react
- ❌ X (Remove) - lucide-react

### Icon Sizes
```
Small: w-3 h-3 (12px)
Default: w-4 h-4 (16px)
Medium: w-5 h-5 (20px)
Large: w-6 h-6 (24px)
```

### Icon Colors
```
Primary: blue-600
Secondary: slate-400
Danger: red-600
Success: green-600
```

---

## ✅ Accessibility Features

### ARIA Labels
```html
<button aria-label="Close modal">
  <X />
</button>
```

### Keyboard Navigation
```
Tab: Move between fields
Shift+Tab: Move backward
E: Open modal (global)
Escape: Close modal
Enter: (in inputs) - normal behavior
```

### Focus Management
```
On Open: Focus on Subject field
On Close: Return focus to trigger button
Trap: Focus stays within modal
```

### Screen Reader
```
Labels: Proper label associations
Required: Indicated in labels
Disabled: Announced as disabled
Status: Loading states announced
```

---

## 🎯 Layout Grid

### Vertical Spacing
```
Between sections: space-y-4 (16px)
Label to input: mb-2 (8px)
Header padding: p-6 (24px)
Content padding: p-6 (24px)
Footer padding: p-6 (24px)
```

### Horizontal Spacing
```
Button group: space-x-3 (12px)
Icon to text: gap-2 (8px) or mr-2
Modal padding: px-6 (24px horizontal)
```

### Border Spacing
```
Header border: border-b
Footer border: border-t
Input borders: border
Border color: slate-200 or slate-300
Border radius: lg (8px)
```

---

## 🖼️ Visual Hierarchy

### Primary Elements (Most Prominent)
1. Modal Title
2. Send Email Button
3. Message Body (largest field)

### Secondary Elements
1. Subject Field
2. Template Dropdown
3. Save as Draft Button

### Tertiary Elements
1. CC/BCC Fields
2. To/From Fields (read-only)
3. Attachments
4. Cancel Button
5. Footer Hint

---

## 📏 Dimensions

### Modal
```
Width: 100% (max 896px)
Height: auto (max 90vh)
Padding: 24px
Border Radius: 12px
```

### Input Fields
```
Height: 40px (py-2)
Width: 100%
Border: 1px
Border Radius: 8px
```

### Textarea
```
Height: ~288px (12 rows)
Width: 100%
Border: 1px
Border Radius: 8px
```

### Buttons
```
Height: 40px (py-2)
Padding: 24px horizontal (px-6)
Border Radius: 8px
Min Width: auto
```

---

This visual guide provides a complete reference for the email composer modal's appearance and behavior. Use it for design consistency and implementation verification.
