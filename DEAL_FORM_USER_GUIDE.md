# Deal Add/Edit Form - User Guide

## Quick Start

### Creating a New Deal

**Path:** CRM > Deals > Add Deal
**URL:** `/crm/deals/add` or `/crm/deals/create`

---

## Step-by-Step Walkthrough

### 1. Smart Search (Optional)

When you first open the form, you'll see the **Smart Deal Creation** panel.

**Option A: Search for Existing Account/Contact**
1. Type in the search box (company name, contact name, or email)
2. Results appear as you type:
   - 🏢 Accounts (with company details)
   - 👤 Contacts (with title and company)
   - 🏢 HRMS Connections (special indicator)
3. Click on a result to select it

**What Happens After Selection:**
- Form switches to "Selected" view
- AI Auto-populated panel appears with suggestions:
  - Account name
  - Primary contact
  - Suggested deal value range
  - Suggested close date (days from today)
  - Win probability estimate
- Click **"Apply All Suggestions"** to fill form fields

**Option B: Create from Scratch**
- Click **"Skip - Create from Scratch"**
- Form sections appear without pre-filled data

---

### 2. Basic Deal Information

**Required Fields (marked with *):**

**Deal Name:**
- Example: "Acme Corp - Enterprise Plan"
- AI Tip: Use company + product pattern

**Deal Value:**
- Enter amount (e.g., 50000)
- Select currency (USD, EUR, GBP)
- If AI suggested: See range and "Apply $50K" button

**Close Date:**
- Click calendar icon or type date
- If AI suggested: See suggestion (e.g., "45 days from today")
- Click "Apply Suggestion" to use it

**Stage:**
- Select from dropdown:
  - Prospecting (default)
  - Qualified
  - Proposal
  - Negotiation
  - Closed-Won
  - Closed-Lost
- Win probability updates automatically

**Win Probability:**
- Auto-calculated based on stage
- Can manually adjust if needed
- Shows AI calculation factors

---

### 3. Account & Contacts

**Account:**
- Search or type company name
- If existing account found:
  - Blue box shows account details
  - Industry, size, revenue displayed
  - Options: "Link to Existing" or "Create New Account"
- Click **"Link to Account"** to search again

**Primary Contact:**
- Search or type contact name
- If contact found:
  - Contact card shows details (name, title, email, phone)
  - **"View Contact"** opens contact detail page
  - **"Change"** searches again

**Contact Role in Deal:**
- Select role from dropdown:
  - Champion (recommended)
  - Decision Maker
  - Influencer
  - User
  - Technical Evaluator

**Additional Contacts:**
- Click **"+ Add Another Contact"** to add more
- AI may suggest adding CEO if deal is large

---

### 4. Deal Ownership & Tracking

**Deal Owner:**
- Select from team members dropdown
- Defaults to "You"

**Source:** (Important for attribution)
- Select where deal came from:
  - Lead Gen (Apollo.io) ← Most common
  - Lead Gen (ZoomInfo)
  - **🏢 HRMS (Recruitment)** ← Special!
  - Website, Manual Entry, Referral, etc.

**If HRMS Source Selected:**
- Orange panel appears
- Select recruited person from dropdown
- Enter recruitment date
- See warm intro advantage message:
  - "33% higher close rate"
- Click **"View HRMS Details"** for more info

**Priority:**
- Low, Medium, High, Critical
- AI may recommend "High" for large deals

**Tags:**
- Click tags to remove (X button)
- Click **"+ Add Tag"** to add custom
- Popular tags shown below (click to add)
- Examples: Enterprise, SaaS, High Value, Hot, Warm

---

### 5. Product/Service Details (Optional)

**Product/Package:**
- Select from dropdown: Basic, Growth, Enterprise, etc.

**Contract Term:**
- Monthly, Quarterly, Annual, Multi-year

**Payment Terms:**
- Due on Receipt, Net 15, Net 30, Net 60, Custom

---

### 6. Description & Notes (Optional but Recommended)

**Description/Notes:**
- 6-line text area
- Describe the deal, customer needs, requirements
- Example: "Enterprise plan for 75-person SaaS company..."

**Next Steps:**
- 5-line text area
- List action items
- Example:
  ```
  1. Send proposal by Dec 10
  2. Schedule demo for stakeholders
  3. Get CEO introduction from John
  ```

---

## Right Sidebar Features

### 👁️ Deal Preview
- See how your deal will appear in the pipeline
- Updates in real-time as you type
- Shows: Name, Value, Stage, Date, Probability, Contact, Tags

### 🤖 AI Deal Insights
- **Win Probability:** Real-time calculation
- **Factors:** What's affecting probability
  - ✅ Positive factors (green)
  - ⚠️ Warnings (yellow)
- **Predicted Outcome:** Expected close date, cycle time
- **Similar Deals:** Your past performance on similar deals

### 💡 AI Recommendations
Up to 5 intelligent suggestions:
1. **Add Tag:** Suggests relevant tags with reasons
2. **Set Priority:** Recommends priority level
3. **Add Contact:** Suggests adding CEO or others
4. **Adjust Date:** Optimizes close date based on data
5. **Next Step:** Best practice actions

Click **"Apply"** or action button to use recommendation.

### ✅ Validation Checklist
- **Required Fields:** 8 fields with checkmarks
  - Deal Name, Value, Date, Stage
  - Account, Contact, Owner, Source
- **Recommended Optional:** 3 fields
  - Product, Description, Next Steps
- **Data Quality Score:** 0-100 with progress bar
- **Status:** "Ready to save!" when 100%

### 📚 Save Options
Choose what happens after saving:
- ☐ View the deal (go to detail page)
- ☐ Create a task (schedule activity)
- ☐ Send email to contact
- ☐ Schedule meeting
- ☐ Add another deal (clear form)

Note: "View deal" and "Add another" can't both be checked.

### 💡 Tips & Help
- Pro tips for deal creation
- HRMS integration reminder
- Best practices

### ⚠️ Duplicate Check (If Detected)
- Shows if similar deal exists
- Displays existing deal details
- Options:
  - **View Existing Deal** (opens in new tab)
  - **Merge** (combine deals)
  - **Save Anyway** (ignore warning)

---

## Saving Your Deal

### Bottom Action Bar (Always Visible)

Three buttons available:

1. **Cancel**
   - Discards changes
   - Returns to deals list
   - No confirmation (in current version)

2. **Save as Draft**
   - Saves incomplete deal
   - No validation required
   - Returns to deals list

3. **Save Deal**
   - Validates all required fields
   - Shows error if incomplete
   - Executes selected save options
   - Success notification

**"Ready to Save" States:**
- Button disabled (gray) if validation fails
- Button enabled (blue) when all required fields filled
- Loading state shown during save

---

## Editing an Existing Deal

**Path:** CRM > Deals > [Deal Name] > Edit
**URL:** `/crm/deals/:id/edit`

**Differences from Create:**
1. Title shows: "✏️ Edit Deal: [Deal Name]"
2. Form pre-populated with existing data
3. Last Modified info shown at top
4. Smart search hidden (account already linked)
5. Save updates instead of creates

**Process:**
1. Modify any fields
2. Changes reflected in preview panel
3. Validation updates in real-time
4. Click "Save Deal" to update

---

## Keyboard Shortcuts

- **Tab:** Navigate between fields
- **Enter:** Submit form (when in input field)
- **Escape:** Close modals
- **Space:** Toggle checkboxes

---

## Tips for Success

### Best Practices

1. **Always Link to Existing Account**
   - Prevents duplicates
   - Gets better AI suggestions
   - Tracks history

2. **Use Smart Search**
   - Faster than manual entry
   - Auto-fills many fields
   - Gets AI recommendations

3. **Add All Decision Makers Upfront**
   - Helps track stakeholder engagement
   - AI suggests CEO for large deals
   - Improves win probability

4. **Set Realistic Close Dates**
   - Use AI suggestions as guide
   - Industry average is helpful
   - Don't be overly optimistic

5. **Tag Your Deals**
   - Makes filtering easier
   - Tracks deal types
   - Helps reporting

6. **Define Next Steps**
   - Keeps team aligned
   - Maintains momentum
   - Prevents deals from stalling

### HRMS Integration Advantage

**If deal came from recruitment:**
1. Select "🏢 HRMS (Recruitment)" as source
2. Fill in recruited person details
3. Benefits:
   - Track warm intro advantage
   - Higher close rate (33% boost)
   - View recruitment history
   - Better reporting

---

## Troubleshooting

### Common Issues

**"Can't Save Deal" (Button Disabled)**
- Check validation checklist
- Ensure all 8 required fields filled
- Look for red asterisks (*)

**"No AI Suggestions Appearing"**
- Make sure you selected an account from search
- Try different search terms
- Click "Apply All Suggestions" after selection

**"Duplicate Warning Showing"**
- Review existing deal details
- Decide if it's truly duplicate
- Options: View it, Merge it, or Save anyway

**"HRMS Panel Not Showing"**
- Must select "🏢 HRMS (Recruitment)" as Source
- Panel appears immediately after selection

**"Probability Not Updating"**
- Should auto-update when changing Stage
- If stuck, manually adjust the number

---

## Examples

### Example 1: Enterprise SaaS Deal

```
Deal Name: Acme Corp - Enterprise Plan
Value: $50,000
Close Date: March 15, 2026 (45 days)
Stage: Prospecting
Account: Acme Corp (75 employees, SaaS)
Contact: John Smith (VP Sales) - Champion
Owner: Alex Rodriguez
Source: Lead Gen (Apollo.io)
Priority: High
Tags: Enterprise, SaaS, Hot Lead
Product: Enterprise Plan
Contract: Annual
Payment: Net 30
Description: 75-person SaaS company needs automation...
Next Steps:
1. Send proposal by Dec 10
2. Schedule demo
3. Get CEO intro
```

### Example 2: HRMS-Sourced Deal

```
Deal Name: TechStart Inc - Growth Package
Value: $35,000
Close Date: February 20, 2026
Stage: Qualified
Account: TechStart Inc
Contact: Sarah Lee (CFO) - Champion
Owner: Alex Rodriguez
Source: 🏢 HRMS (Recruitment)
  → Recruited: Sarah Lee
  → Date: Nov 14, 2024
Priority: High
Tags: HRMS, Warm Intro, Fast Track
Description: Sarah joined from HRMS, has strong relationship...
```

---

## Need Help?

- **In-App Tips:** Check right sidebar "Tips & Help" panel
- **AI Recommendations:** Follow AI suggestions for best results
- **Validation Checklist:** Shows exactly what's missing
- **Preview Panel:** See how deal will look before saving

---

**Last Updated:** December 6, 2025
**Version:** 1.0
