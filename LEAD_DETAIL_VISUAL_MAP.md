# Lead Detail Page - Visual Structure Map

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔷 MODULE NAVIGATION (Blue tabs)                                │
│ [Dashboard] [Leads*] [Intelligence] [Campaigns] [Analytics]     │
│                                                      [Settings]  │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Dashboard > Leads > Sarah Lee                      │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 HERO HEADER                                                  │
│ Sarah Lee | Score: 92/100 ●●●●●●●●●○                          │
│ CFO at TechStart Inc | Status: New 🟢                          │
│ 📧 sarah@techstart.com | 📞 +1 555-0456 | 💼 LinkedIn         │
│ [Email] [Call] [Add to Sequence] [Qualify] [More]              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────┐
│ LEFT COLUMN (65%)              │ RIGHT COLUMN (35%)              │
├─────────────────────────────────┼─────────────────────────────────┤
│                                 │                                 │
│ 🟣 AI INSIGHTS (Purple)         │ 🎯 AI LEAD SCORE                │
│ ├─ Overall: 92/100             │ ├─ 92/100 (Large)               │
│ ├─ Fit: 90/100                 │ ├─ Breakdown:                   │
│ ├─ Engagement: 85/100          │ │  • Fit: 90/100                │
│ ├─ Intent: 88/100              │ │  • Engagement: 85/100         │
│ ├─ HRMS Bonus: +33%            │ │  • Intent: 88/100             │
│ ├─ Conversion: 67%             │ ├─ 🟣 HRMS Bonus Box            │
│ ├─ Why This Score              │ │  Base: 69 → Final: 92         │
│ └─ Actions (3)                 │ └─ [View Score History]         │
│                                 │                                 │
├─────────────────────────────────┼─────────────────────────────────┤
│                                 │                                 │
│ 🔍 COMPANY INFO (White)         │ 🤖 NEXT BEST ACTIONS            │
│ ├─ Company details (grid)      │ ├─ 4 AI recommendations         │
│ ├─ Tech Stack (chips)          │ ├─ Each with reason             │
│ └─ Recent News (3)             │ └─ Why box (blue)               │
│                                 │                                 │
├─────────────────────────────────┼─────────────────────────────────┤
│                                 │                                 │
│ 👥 DECISION MAKERS (3)          │ 🔄 SIMILAR LEADS (3)            │
│ ├─ Sarah Lee (This lead)       │ ├─ Emma Wilson - 94             │
│ ├─ Robert Chen [Add]           │ ├─ Alex Johnson - 90            │
│ └─ Michael Zhang [Add]         │ └─ Robert Chang - 85            │
│                                 │                                 │
├─────────────────────────────────┼─────────────────────────────────┤
│                                 │                                 │
│ 🟣 FROM HRMS (Purple border)    │ ✅ ENRICHMENT SOURCES           │
│ ├─ Recruited: Nov 2024         │ ├─ ✅ Apollo.io (Nov 15)       │
│ ├─ Recruiter: Jane Smith       │ ├─ ✅ ZoomInfo (Nov 14)        │
│ ├─ Fee: $15,000                │ ├─ ✅ Clearbit (Nov 15)        │
│ ├─ Advantages (4 points)       │ ├─ ✅ LinkedIn (Nov 15)        │
│ └─ [View in HRMS]              │ └─ [Configure Sources]          │
│                                 │                                 │
├─────────────────────────────────┤                                 │
│                                 │                                 │
│ 🟠 INTELLIGENCE SIGNAL          │                                 │
│ ├─ Type: 💰 Funding            │                                 │
│ ├─ Event: $10M Series A        │                                 │
│ ├─ AI Analysis (3 points)      │                                 │
│ ├─ Related Signals (2)         │                                 │
│ └─ [View Full Signal]          │                                 │
│                                 │                                 │
├─────────────────────────────────┤                                 │
│                                 │                                 │
│ ⏰ ACTIVITY TIMELINE            │                                 │
│ ├─ 🟢 Lead created (now)       │                                 │
│ ├─ 🟢 Enriched (10m ago)       │                                 │
│ ├─ 🟢 Note added (5m ago)      │                                 │
│ └─ [Load More]                 │                                 │
│                                 │                                 │
├─────────────────────────────────┤                                 │
│                                 │                                 │
│ 📝 NOTES & FILES                │                                 │
│ ├─ Notes (1) [+ Add]           │                                 │
│ └─ Files (0) [+ Upload]        │                                 │
│                                 │                                 │
└─────────────────────────────────┴─────────────────────────────────┘
```

## Color Legend
- 🟣 **Purple** = HRMS-related (AI Insights, FROM HRMS, Bonus sections)
- 🟠 **Orange** = Intelligence Signal (funding events, etc.)
- ⬜ **White** = Standard sections (Company Info, Decision Makers, etc.)
- 🔷 **Blue** = Navigation, buttons, interactive elements
- 🟢 **Green** = Status indicators, checkmarks, positive signals

## Section Count
- **Left Column**: 7 major sections
- **Right Column**: 4 major sections
- **Total Cards**: 11 distinct sections

## Unique Features
1. **Dual Source Highlighting**
   - HRMS leads = Purple styling
   - Intelligence leads = Orange styling

2. **Score Breakdown**
   - Visual dots (●●●●●●●●●○)
   - Percentage bars
   - Color coding (green = high, yellow = medium, red = low)

3. **AI Integration**
   - Score analysis
   - Action recommendations
   - Conversion predictions
   - Similar lead suggestions

4. **Data Enrichment**
   - Multiple source verification
   - Recent news tracking
   - Tech stack identification
   - Decision maker mapping

## Quick Reference
- **Main CTA**: Email button (blue, hero section)
- **Key Metric**: 92/100 AI Lead Score (large, right column)
- **Unique Value**: HRMS Connection (purple cards)
- **Action Driver**: Intelligence Signal (orange card)
