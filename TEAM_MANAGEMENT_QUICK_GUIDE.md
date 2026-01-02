# Team Management - Quick Reference Guide

## 🚀 Quick Access

**Route**: `/crm/team`
**Navigation**: CRM → Team (last tab before "...")

---

## 📑 5 Main Tabs

### 1. **Overview**
Dashboard with KPIs, activity feed, and leaderboard

**Key Stats:**
- 8 Total Members (6 active)
- $8.64M Total Revenue (112% quota)
- 148 Deals Won
- 84.3% Average Win Rate

**Quick Actions:**
- Recent Activity Feed (last 8 actions)
- Leaderboard (top 5 performers)

### 2. **Team Members**
Complete team directory

**Two Views:**
- **Grid**: Visual cards with avatars
- **List**: Sortable table

**Filters:**
- Search (name, email, title)
- Role (Manager, AE, SDR, CS)
- Status (Active, Away, Offline)

**8 Members:**
1. Sarah Chen - Sales Manager
2. Michael Rodriguez - Senior AE
3. Emily Johnson - AE
4. David Kim - SDR
5. Jessica Martinez - AE
6. Robert Taylor - SDR
7. Amanda Wilson - CS Manager
8. James Anderson - AE

### 3. **Performance**
Analytics and top performers

**Features:**
- Performance chart placeholder
- Top 3 podium (Gold/Silver/Bronze)
- Performance badges
- Rankings by revenue

### 4. **Territories**
Geographic coverage

**5 Territories:**
- West Coast: $3.2M / 145 accounts
- East Coast: $2.84M / 132 accounts
- Central: $1.52M / 98 accounts
- Midwest: $1.42M / 87 accounts
- Southeast: $1.28M / 76 accounts

### 5. **Goals**
Team objectives tracking

**5 Active Goals:**
- Q1 Revenue Target: 94% complete (On Track)
- Enterprise Deals: 80% complete (On Track)
- Lead Generation: 84% complete (At Risk)
- Product Demos: 67% complete (Behind)
- Customer Expansion: 110% complete ✅

---

## 🎨 Quick Visual Guide

### Status Indicators
- 🟢 **Green Dot**: Active
- 🟡 **Yellow Dot**: Away
- ⚫ **Gray Dot**: Offline

### Performance Badges
- 🏆 Top Performer
- 🎯 Deal Closer
- ⚡ Quick Response
- 📈 Rising Star
- 🤝 Team Player
- 👑 Customer Champion
- 🔥 Most Active

### Goal Status Colors
- 🟢 **Green**: On Track (80%+ progress)
- 🟡 **Yellow**: At Risk (60-79%)
- 🔴 **Red**: Behind (<60%)
- 🔵 **Blue**: Completed (100%+)

---

## ⚡ Quick Tests

### 1-Minute Smoke Test
1. Navigate to `/crm/team`
2. See Overview tab with 4 stat cards
3. Click "Team Members" tab
4. See 8 member cards in grid
5. Click list icon → See table view
6. Type "Michael" in search → See filtered result
7. Click "Performance" tab → See top 3 podium
8. Click "Territories" → See 5 territory cards
9. Click "Goals" → See 5 goal cards

✅ If all steps work, module is functional!

### 3-Minute Feature Test
1. **Overview Tab**: Verify all stats are visible
2. **Members Tab**: Test search with "SDR" → See 2 results
3. **Members Tab**: Filter Role = "Account Executive" → See 4 members
4. **Members Tab**: Toggle Grid/List views
5. **Performance Tab**: Check top 3 have badges
6. **Territories Tab**: Verify progress bars are filled
7. **Goals Tab**: Check Q1 goal shows 94% progress

---

## 🎯 Key Numbers

### Team Stats
- **Members**: 8 total, 6 active
- **Revenue**: $8.64M (112% quota)
- **Deals**: 148 won, 67 in progress
- **Win Rate**: 84.3% average
- **Pipeline**: $3.61M total

### Individual Top Performers
1. **Michael Rodriguez**: $1.84M (115% quota)
2. **Emily Johnson**: $1.52M (108% quota)
3. **Jessica Martinez**: $1.42M (93% quota)

### Territory Coverage
- **Total Accounts**: 538 accounts
- **Total Territory Revenue**: $8.64M
- **Geographic Coverage**: 5 major regions

---

## 🔍 Search Examples

### Member Search
- "Michael" → Michael Rodriguez
- "SDR" → David Kim, Robert Taylor
- "chicago" → Jessica Martinez
- "@company.com" → All members

### Filter Combinations
- Role = AE + Status = Active → 4 results
- Role = SDR → 2 results
- Status = Away → 1 result (Jessica Martinez)

---

## 💡 Quick Actions

### From Header
- **Export** → Download team data
- **Add Member** → Open add member form

### From Member Cards
- **View Profile** → Navigate to profile page
- **Message** → Open chat
- **3-dot menu** → More actions

### From Territory Cards
- **Click card** → View territory details
- **Click avatar** → View member profile

### From Goal Cards
- **Click card** → View goal details
- **Click avatar** → View assignee profile

---

## 📊 Data Format Examples

### Currency
- $1,840,000 → $1.84M
- $680,000 → $680K
- $45,000 → $45K

### Percentages
- Quota: 115%
- Win Rate: 90.5%
- Progress: 94%

### Time
- "Just now" (< 5 mins)
- "15m ago" (< 1 hour)
- "2h ago" (< 24 hours)
- "3d ago" (> 24 hours)

---

## 🛠️ Troubleshooting

### Issue: Tab not showing
**Fix**: Check CRMNavigation.tsx includes Team tab

### Issue: No data showing
**Fix**: Verify sampleTeamData.ts is imported

### Issue: Filters not working
**Fix**: Check filteredMembers useMemo dependencies

### Issue: Build error
**Fix**: Run `npm run build` and check for TypeScript errors

---

## 📱 Mobile View

On mobile devices:
- Stats stack vertically (1 column)
- Member cards stack (1 column)
- Table scrolls horizontally
- Filters collapse to dropdown
- Touch-friendly buttons (44px min)

---

## 🎓 For Developers

### Key Files
```
src/types/team.ts                    # Types
src/utils/sampleTeamData.ts          # Data
src/pages/CRM/TeamManagementPage.tsx # Component
```

### State Variables
```typescript
searchQuery: string                  # Search filter
roleFilter: string                   # Role filter
statusFilter: string                 # Status filter
selectedView: 'grid' | 'list'        # View mode
selectedTab: string                  # Active tab
```

### Helper Functions
```typescript
formatCurrency(value)    # Format numbers to $1.84M
getTimeAgo(timestamp)    # Convert to "2h ago"
getStatusColor(status)   # Get status badge colors
getRoleDisplay(role)     # Get readable role names
```

---

## ✅ Feature Checklist

- [x] 5 tabs implemented
- [x] Grid and list views
- [x] Search functionality
- [x] Role filtering
- [x] Status filtering
- [x] 8 team members
- [x] Recent activity feed
- [x] Leaderboard rankings
- [x] 5 territories
- [x] 5 team goals
- [x] Responsive design
- [x] Toast notifications
- [x] Hover effects
- [x] Status indicators
- [x] Progress bars
- [x] Avatar gradients

---

## 🎯 Demo Script (2 Minutes)

**For Stakeholders:**

> "Let me show you our new Team Management module.
>
> **[Overview Tab]** Here's our team dashboard with key metrics - we have 8 team members who've generated $8.64M in revenue, that's 112% of quota. Our win rate is 84.3%.
>
> **[Members Tab]** Here's our full team directory. I can search for anyone - let me search for Michael... and here he is with all his stats. I can switch between this card view and a detailed table view. We can filter by role, status, everything.
>
> **[Performance Tab]** This shows our top performers. Michael Rodriguez is #1 with $1.84M in revenue. Each person has performance badges.
>
> **[Territories Tab]** We've divided the country into 5 territories. West Coast is our highest at $3.2M. Each territory shows quota achievement and who's assigned.
>
> **[Goals Tab]** Finally, our team goals. We're on track for Q1 revenue target at 94% complete. Customer expansion goal is already completed at 110%!
>
> Everything is real-time, searchable, and mobile-responsive."

---

*Quick Reference Guide - Last Updated: December 25, 2025*
