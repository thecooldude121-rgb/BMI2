# Sales Intelligence Feed - Backend Integration Points

**Component:** Screen 4.1 - Sales Intelligence Feed
**Status:** Frontend Complete - Backend Integration Required
**Last Updated:** January 5, 2026

---

## 🎯 OVERVIEW

The Sales Intelligence Feed is a **CORE FEATURE** that automatically monitors and surfaces buying signals from various data sources. This document outlines all integration points required to connect the frontend to backend services.

---

## 📡 DATA SOURCES & APIs

### 1. Crunchbase API (Funding Data)
**Purpose:** Track company funding rounds, acquisitions, IPOs

**Endpoints Needed:**
```
GET /api/crunchbase/funding-rounds
  - Parameters: date_range, min_amount, max_amount
  - Returns: List of recent funding announcements

GET /api/crunchbase/companies/{company_id}
  - Returns: Company details, funding history
```

**Data Extracted:**
- Round size (Series A/B/C)
- Lead investor
- Total funding to date
- Use of funds (when disclosed)
- Company description
- Employee count
- Location

**Webhook Support:**
- Real-time notifications for new funding rounds
- Webhook URL: `/api/webhooks/crunchbase/funding`

**Rate Limits:** 1,000 requests/hour
**Authentication:** API key in header

---

### 2. Google News API (Company News)
**Purpose:** Track company announcements, product launches, expansions

**Endpoints Needed:**
```
GET /api/news/search
  - Parameters: keywords, date_range, sources
  - Returns: List of news articles

GET /api/news/company/{company_name}
  - Returns: Recent news for specific company
```

**Data Extracted:**
- Article title
- Publication date
- Source (TechCrunch, VentureBeat, etc.)
- Summary/snippet
- Full article URL
- Related companies mentioned

**Sources to Monitor:**
- TechCrunch
- VentureBeat
- BusinessWire
- PRNewswire
- Company blogs (RSS feeds)

**Rate Limits:** 10,000 requests/day
**Authentication:** API key in query parameter

---

### 3. LinkedIn Jobs API (Hiring Signals)
**Purpose:** Track job postings, headcount growth

**Endpoints Needed:**
```
GET /api/linkedin/jobs/search
  - Parameters: company, job_titles, date_posted
  - Returns: List of job postings

GET /api/linkedin/company/{company_id}/jobs
  - Returns: All active jobs for company
```

**Data Extracted:**
- Job title
- Department
- Location (remote/hybrid/onsite)
- Posted date
- Number of applicants
- Seniority level
- Job description (for keyword matching)

**Signals Generated When:**
- 5+ jobs posted in same department
- Senior roles posted (VP, Director, C-level)
- Sales/Marketing roles (indicate buying readiness)
- HR/Recruiting roles (HRMS opportunity)

**Rate Limits:** 500 requests/hour
**Authentication:** OAuth 2.0

---

### 4. RSS Feed Aggregator
**Purpose:** Monitor company blogs, press releases

**Sources:**
- Company blogs (auto-discover via RSS)
- Press release wires
- Industry publications
- Startup directories

**Scraping Schedule:** Every 6 hours

**Data Extracted:**
- Article title
- Publication date
- Content summary
- Keywords/tags
- Author
- Category

---

## 🤖 AI/ML SERVICES

### 1. Signal Classification Service
**Endpoint:** `POST /api/ai/classify-signal`

**Input:**
```json
{
  "source": "news_article",
  "title": "TechStart raises $10M Series A",
  "content": "...",
  "company": "TechStart Inc"
}
```

**Output:**
```json
{
  "signal_type": "funding",
  "confidence": 0.95,
  "key_details": {
    "round_size": "$10M",
    "round_type": "Series A",
    "investor": "Accel Partners"
  }
}
```

**Classifications:**
- 💰 Funding (Series A/B/C, acquisitions)
- 📈 Hiring (job postings, headcount growth)
- 🚀 Product Launch (new products, features)
- 🌍 Expansion (new offices, markets)

---

### 2. Lead Scoring Service
**Endpoint:** `POST /api/ai/score-lead`

**Input:**
```json
{
  "company": "TechStart Inc",
  "signal": {
    "type": "funding",
    "details": {...}
  },
  "company_data": {
    "employees": 45,
    "industry": "FinTech",
    "location": "SF, CA"
  }
}
```

**Output:**
```json
{
  "lead_score": 88,
  "buying_intent": "high",
  "confidence": 0.92,
  "reasoning": [
    "High buying intent - Budget confirmed",
    "Growth stage - Likely building teams",
    "Fits ICP - Size and industry match"
  ]
}
```

**Score Factors:**
- Signal type weight (funding = high, hiring = medium)
- Company size match with ICP
- Industry relevance
- Historical conversion data
- Budget indicators
- Timing (recent signals score higher)

**Score Range:** 0-100
- 80-100: Hot Lead (immediate action)
- 60-79: Warm Lead (schedule follow-up)
- 40-59: Cool Lead (nurture)
- 0-39: Cold Lead (consider dismissing)

---

### 3. Decision Maker Identification Service
**Endpoint:** `POST /api/ai/find-decision-makers`

**Input:**
```json
{
  "company": "TechStart Inc",
  "signal_type": "funding",
  "job_postings": [...]
}
```

**Output:**
```json
{
  "decision_makers": [
    {
      "name": "John Doe",
      "title": "CEO",
      "email": "john@techstart.com",
      "linkedin": "linkedin.com/in/johndoe",
      "confidence": 0.89
    },
    {
      "name": "Jane Smith",
      "title": "VP of Sales",
      "email": "jane@techstart.com",
      "linkedin": "linkedin.com/in/janesmith",
      "confidence": 0.85
    }
  ]
}
```

**Sources:**
- LinkedIn profiles
- Company website (About/Team pages)
- Job postings (hiring manager info)
- Press releases (quotes from executives)
- Email pattern detection

---

### 4. Buying Intent Detection Service
**Endpoint:** `POST /api/ai/analyze-intent`

**Input:**
```json
{
  "signals": [...],
  "company_data": {...}
}
```

**Output:**
```json
{
  "intent_level": "high",
  "intent_score": 0.87,
  "indicators": [
    "Budget confirmed (funding received)",
    "Actively hiring sales team",
    "Recent product launch needs support tools"
  ],
  "recommended_actions": [
    "Reach out within 48 hours",
    "Mention funding congratulations",
    "Offer sales enablement tools"
  ]
}
```

**Intent Levels:**
- High: Multiple strong signals, immediate action needed
- Medium: Some signals, schedule follow-up
- Low: Weak signals, add to nurture campaign
- None: No buying signals detected

---

### 5. ICP Matching Service
**Endpoint:** `POST /api/ai/match-icp`

**Input:**
```json
{
  "company": {
    "name": "TechStart Inc",
    "employees": 45,
    "industry": "FinTech",
    "location": "SF, CA",
    "funding": "$10M Series A"
  },
  "icp_criteria": {
    "min_employees": 10,
    "max_employees": 500,
    "industries": ["FinTech", "SaaS"],
    "locations": ["US", "CA"]
  }
}
```

**Output:**
```json
{
  "is_match": true,
  "match_score": 0.92,
  "matched_criteria": [
    "Employee count in range",
    "Industry match",
    "Location match"
  ],
  "failed_criteria": []
}
```

**Auto-Dismiss Logic:**
- If match_score < 0.4, automatically dismiss signal
- If match_score 0.4-0.6, flag for manual review
- If match_score > 0.6, show in feed

---

## 🔄 BACKEND SERVICES

### 1. Signal Ingestion Service
**Purpose:** Collect and process signals from all sources

**Process:**
1. **Fetch Data** (every 6 hours)
   - Call Crunchbase API
   - Scrape Google News
   - Fetch LinkedIn jobs
   - Poll RSS feeds

2. **Deduplicate**
   - Check if signal already exists
   - Merge duplicate signals for same company

3. **Classify**
   - Send to AI Classification Service
   - Determine signal type
   - Extract key details

4. **Enrich**
   - Find decision makers
   - Calculate lead score
   - Detect buying intent
   - Match against ICP

5. **Store**
   - Save to `intelligence_signals` table
   - Update company record
   - Link related signals

6. **Notify**
   - Send real-time notification to users
   - Update feed counters

**Cron Schedule:** `0 */6 * * *` (every 6 hours)

---

### 2. Signal Processing Service
**Endpoint:** `POST /api/signals/process`

**Database Table: `intelligence_signals`**
```sql
CREATE TABLE intelligence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type VARCHAR(50) NOT NULL,
  company_id UUID REFERENCES companies(id),
  company_name VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source VARCHAR(100),
  source_url TEXT,
  discovered_at TIMESTAMP DEFAULT NOW(),
  lead_score INTEGER,
  buying_intent VARCHAR(50),
  ai_analysis JSONB,
  key_details JSONB,
  decision_makers JSONB,
  related_signals UUID[],
  status VARCHAR(50) DEFAULT 'new',
  assigned_to UUID REFERENCES users(id),
  converted_to_lead_id UUID REFERENCES leads(id),
  dismissed_at TIMESTAMP,
  dismissed_by UUID REFERENCES users(id),
  dismissed_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_signals_status ON intelligence_signals(status);
CREATE INDEX idx_signals_company ON intelligence_signals(company_id);
CREATE INDEX idx_signals_type ON intelligence_signals(signal_type);
CREATE INDEX idx_signals_score ON intelligence_signals(lead_score DESC);
CREATE INDEX idx_signals_discovered ON intelligence_signals(discovered_at DESC);
```

---

### 3. Lead Conversion Service
**Endpoint:** `POST /api/signals/{signal_id}/convert-to-lead`

**Input:**
```json
{
  "signal_id": "uuid",
  "decision_makers": ["dm1_id", "dm2_id"],
  "sequence_id": "seq_uuid",
  "notes": "Converted from funding signal"
}
```

**Process:**
1. Create lead(s) in `leads` table
2. Set lead source = "intelligence"
3. Set lead score from signal
4. Link to signal via `source_signal_id`
5. Add decision makers as contacts
6. Enroll in sequence (if specified)
7. Update signal status to "converted"
8. Log conversion in analytics

**Output:**
```json
{
  "success": true,
  "leads_created": [
    {
      "id": "lead_uuid",
      "name": "John Doe",
      "company": "TechStart Inc",
      "score": 88
    }
  ]
}
```

---

### 4. Signal Feedback Loop Service
**Purpose:** Learn from outcomes to improve scoring

**Process:**
1. **Track Conversions**
   - Monitor leads created from signals
   - Track conversion to contacts
   - Track conversion to deals
   - Track deal close/loss

2. **Calculate Success Metrics**
   - Signal type → Lead conversion rate
   - Signal type → Deal conversion rate
   - Lead score accuracy
   - Buying intent accuracy

3. **Retrain Models**
   - Feed outcomes back to AI models
   - Adjust scoring weights
   - Improve classification accuracy
   - Refine ICP matching

4. **Update Signal Scores**
   - Recalculate scores for pending signals
   - Prioritize high-performing signal types

**Cron Schedule:** Daily at 2 AM

---

## 🔔 REAL-TIME NOTIFICATIONS

### WebSocket Events
**Connection:** `wss://api.example.com/ws/intelligence`

**Events:**
1. **New Signal**
```json
{
  "event": "signal.new",
  "data": {
    "signal_id": "uuid",
    "company": "TechStart Inc",
    "type": "funding",
    "score": 88,
    "preview": "TechStart raises $10M..."
  }
}
```

2. **Signal Converted**
```json
{
  "event": "signal.converted",
  "data": {
    "signal_id": "uuid",
    "lead_id": "uuid",
    "converted_by": "user_name"
  }
}
```

3. **High-Priority Signal**
```json
{
  "event": "signal.hot_lead",
  "data": {
    "signal_id": "uuid",
    "score": 95,
    "urgency": "high",
    "message": "Hot lead detected! TechStart just raised $10M"
  }
}
```

---

## 🎯 INTEGRATION WITH OTHER MODULES

### 1. Lead Generation Module
**Integration Points:**

**Lead Creation:**
- Pre-fill company data from signal
- Set lead source badge = "🔔 Intelligence"
- Link via `source_signal_id` field
- Copy lead score from signal
- Add signal reference in notes

**Leads List:**
- Filter by "Source: Intelligence"
- Show signal badge on intelligence-sourced leads
- Link back to original signal

**Lead Detail View:**
- Show "Source Signal" section
- Display original signal details
- Link to signal detail view
- Show all related signals for company

---

### 2. Email Sequences Module
**Integration Points:**

**Sequence Templates:**
- **Funding Congratulations Sequence:**
  - Email 1: Congratulate on funding (Day 0)
  - Email 2: Offer to help scale (Day 3)
  - Email 3: Case study from similar companies (Day 7)

- **Hiring Growth Outreach Sequence:**
  - Email 1: Noticed hiring surge (Day 0)
  - Email 2: Tools to help scale team (Day 3)
  - Email 3: Demo invitation (Day 7)

- **Product Launch Partnership Sequence:**
  - Email 1: Congratulate on launch (Day 0)
  - Email 2: Integration opportunities (Day 3)
  - Email 3: Partnership proposal (Day 7)

**Auto-Enrollment:**
- Option in "Add to Leads" modal
- Automatically select best sequence based on signal type
- Personalize email content with signal details

---

### 3. HRMS Module (Future)
**Integration Points:**

**Hiring Signals:**
- Detect HR/recruitment job postings
- Flag as potential HRMS opportunity
- Highlight in signal: "Local hiring = potential HRMS opportunity"
- Cross-sell indicator

**Dual Product Pitch:**
- If company shows both lead gen AND hiring signals
- Suggest comprehensive platform sale
- Bundle discount opportunity

---

### 4. Analytics Module
**Integration Points:**

**Dashboard Widgets:**
- "Intelligence Performance" card
- Show conversion rates by signal type
- ROI metrics (signals → closed deals)
- Time to conversion averages

**Reports:**
- "Intelligence Source Performance"
- Compare Intelligence vs other lead sources
- Show which signal types convert best
- Identify top-performing data sources

**Metrics to Track:**
```sql
SELECT
  signal_type,
  COUNT(*) as total_signals,
  COUNT(converted_to_lead_id) as converted_to_leads,
  COUNT(converted_to_lead_id) * 100.0 / COUNT(*) as conversion_rate,
  AVG(lead_score) as avg_lead_score,
  SUM(deal_value) as total_revenue
FROM intelligence_signals
LEFT JOIN leads ON leads.id = converted_to_lead_id
LEFT JOIN deals ON deals.lead_id = leads.id
GROUP BY signal_type
ORDER BY conversion_rate DESC;
```

---

### 5. CRM Module
**Integration Points:**

**Contact Records:**
- Link signals to existing contacts
- Show "Recent Signals" section in contact detail
- Alert when existing contact's company has new signal

**Deal Records:**
- Track which deals originated from signals
- Show signal attribution in deal detail
- Calculate signal → deal conversion rate

**Feedback Loop:**
- When intelligence-sourced deal closes:
  - Feed outcome back to AI models
  - Improve lead scoring for similar signals
  - Identify successful signal patterns

---

## 🛡️ SMART FILTERING & AUTOMATION

### 1. ICP Matching (Auto-Dismiss)
**Rules:**
```javascript
if (company.employees < ICP.min_employees) {
  auto_dismiss("Company too small");
}

if (!ICP.industries.includes(company.industry)) {
  auto_dismiss("Industry not in ICP");
}

if (!ICP.locations.includes(company.location)) {
  auto_dismiss("Location not in target market");
}

if (lead_score < 40) {
  auto_dismiss("Lead score below threshold");
}
```

---

### 2. Duplicate Prevention
**Check Before Creating Signal:**
```sql
SELECT * FROM intelligence_signals
WHERE company_name = :company_name
  AND signal_type = :signal_type
  AND discovered_at > NOW() - INTERVAL '30 days';
```

**Also Check Against Existing Leads:**
```sql
SELECT * FROM leads
WHERE company = :company_name
  AND status IN ('open', 'contacted', 'qualified');
```

If lead already exists:
- Don't create new signal
- Add note to existing lead
- Update lead score if higher

---

### 3. Relevance Scoring
**Prioritization Algorithm:**
```javascript
relevance_score = (
  (lead_score * 0.4) +
  (recency_score * 0.3) +
  (signal_quality * 0.2) +
  (engagement_potential * 0.1)
)

where:
  recency_score = 100 - (days_old * 5)
  signal_quality = confidence_score * 100
  engagement_potential = decision_makers.length * 10
```

**Sort Order:**
1. Relevance score (high to low)
2. Discovered date (recent first)
3. Lead score (high to low)

---

## 📊 API ENDPOINTS SUMMARY

### Frontend → Backend

**GET `/api/intelligence/signals`**
- Query parameters: type, date_range, industry, size, status, page, limit
- Returns: Paginated list of signals
- Auth: Required

**GET `/api/intelligence/signals/:id`**
- Returns: Full signal details
- Auth: Required

**POST `/api/intelligence/signals/:id/convert`**
- Body: decision_makers[], sequence_id, notes
- Returns: Created lead IDs
- Auth: Required

**POST `/api/intelligence/signals/:id/dismiss`**
- Body: reason, note
- Returns: Success confirmation
- Auth: Required

**POST `/api/intelligence/signals/:id/undo-dismiss`**
- Returns: Restored signal
- Auth: Required

**GET `/api/intelligence/stats`**
- Returns: Total, new, converted counts, conversion rate
- Auth: Required

**POST `/api/intelligence/signals/:id/watch`**
- Returns: Added to watch list
- Auth: Required

**POST `/api/intelligence/signals/:id/reminder`**
- Body: reminder_date, reminder_time
- Returns: Reminder created
- Auth: Required

**POST `/api/intelligence/signals/:id/share`**
- Body: user_ids[], message
- Returns: Shared with team members
- Auth: Required

**GET `/api/intelligence/signals/:id/export`**
- Returns: CSV/PDF export of signal
- Auth: Required

**POST `/api/intelligence/signals/:id/report`**
- Body: reason, details
- Returns: Report submitted
- Auth: Required

---

## 🔐 SECURITY & PERMISSIONS

### Access Control
**Roles:**
- **Admin:** Full access to all signals
- **Manager:** Access to signals for their team/territory
- **Rep:** Access to signals assigned to them

**Permissions:**
- `intelligence.view` - View signals
- `intelligence.convert` - Convert signals to leads
- `intelligence.dismiss` - Dismiss signals
- `intelligence.export` - Export signal data
- `intelligence.configure` - Configure data sources

### Data Privacy
- Signals contain publicly available data only
- No scraping of private/internal company data
- Respect robots.txt and terms of service
- GDPR compliance for EU companies
- Opt-out mechanism for companies who request removal

---

## 📈 PERFORMANCE REQUIREMENTS

### Response Times
- Signal list load: < 500ms
- Signal details load: < 300ms
- Convert to lead: < 1s
- Real-time notifications: < 100ms latency

### Scalability
- Support 10,000+ signals in database
- Handle 100+ concurrent users
- Process 1,000+ new signals per day
- Store 1 year of historical signals

### Caching Strategy
- Cache signal list for 5 minutes
- Cache company data for 1 hour
- Invalidate cache on signal update
- Use Redis for fast access

---

## 🚀 DEPLOYMENT CHECKLIST

### Phase 1: Core Infrastructure
- [ ] Set up signal database tables
- [ ] Configure API keys (Crunchbase, Google News, LinkedIn)
- [ ] Deploy signal ingestion service
- [ ] Set up cron jobs for data fetching
- [ ] Implement basic AI classification

### Phase 2: AI Services
- [ ] Deploy lead scoring model
- [ ] Implement decision maker identification
- [ ] Add buying intent detection
- [ ] Configure ICP matching rules
- [ ] Set up feedback loop

### Phase 3: Integration
- [ ] Connect to Lead Gen module
- [ ] Add email sequence templates
- [ ] Integrate with Analytics
- [ ] Link to CRM records
- [ ] Enable real-time notifications

### Phase 4: Testing
- [ ] Test with sample signals
- [ ] Verify lead conversion flow
- [ ] Test filtering and search
- [ ] Load testing with 1,000+ signals
- [ ] Security audit

### Phase 5: Production
- [ ] Production deployment
- [ ] Monitor performance
- [ ] Track conversion metrics
- [ ] Gather user feedback
- [ ] Iterate on AI models

---

## 📝 NOTES FOR BACKEND DEVELOPERS

### Current Status
- Frontend implementation complete
- All UI interactions functional
- Mock data in place
- Navigation routes defined
- Modals fully implemented

### Next Steps
1. Create database schema
2. Implement API endpoints
3. Connect data sources
4. Deploy AI services
5. Set up cron jobs
6. Configure webhooks
7. Enable real-time updates

### Testing Recommendations
- Use test API keys for development
- Mock AI responses initially
- Test with small dataset first
- Gradually increase data volume
- Monitor API rate limits

### Common Gotchas
- Rate limiting on LinkedIn API
- Crunchbase requires paid tier for webhooks
- Google News API has daily limits
- AI classification needs training data
- Decision maker emails may be inaccurate

---

## 🎯 SUCCESS METRICS

**Key Performance Indicators:**
- Signal → Lead conversion rate: Target 10%
- Lead → Deal conversion rate: Target 20%
- Average lead score accuracy: Target 85%
- Time to process new signal: Target < 1 hour
- User engagement: Target 50% of signals reviewed
- False positive rate: Target < 15%

---

**Ready for Backend Implementation** ✅
