# MEETING TRANSCRIPT DATA STRUCTURE

**Complete data model and database schema for meeting transcripts**

---

## 📊 DATA OVERVIEW

### Meeting: Acme Corp - Proposal Review
**ID:** `meeting_acme_001`

| Metric | Value |
|--------|-------|
| Total Words | 3,245 |
| Duration | 45 minutes |
| Average Words/Minute | 72 |
| Speakers | 2 (John Smith, Alex Rodriguez) |
| AI Confidence | 95% |
| Language | English (US) |
| Processed | Dec 7, 2024 11:30 AM |

---

## 👥 SPEAKERS

### John Smith (JS)
| Attribute | Value |
|-----------|-------|
| Speaking Time | 22 minutes |
| Speaking % | 49% |
| Word Count | 1,590 words |
| Sentiment Score | 85% (Positive) |

### Alex Rodriguez (AR)
| Attribute | Value |
|-----------|-------|
| Speaking Time | 23 minutes |
| Speaking % | 51% |
| Word Count | 1,655 words |
| Sentiment Score | 88% (Positive) |

---

## 🎯 KEY MOMENTS (6)

### 1. Budget Confirmed (05:30)
```
Type: Financial Decision
Speaker: John Smith
Content: "$50,000 annual cost within budget"
AI Action: Deal amount confirmed
Icon: 💰
```

### 2. Very Positive Response (06:20)
```
Type: Sentiment Peak
Speaker: Alex Rodriguez
Content: "Excellent! That's great to hear"
Sentiment: 95% (Very Positive)
Icon: 😊
```

### 3. Timeline Discussed (15:45)
```
Type: Timeline Decision
Speaker: Alex Rodriguez
Content: "6 months starting Q1 2026, go-live March 15"
AI Action: Close date updated
Icon: 📅
```

### 4. Integration Concerns (22:10)
```
Type: Objection/Concern
Speaker: John Smith
Content: "Salesforce integration critical"
AI Action: Competitor noted, concern flagged
Icon: 🔌
```

### 5. CEO Approval Needed (35:20)
```
Type: Decision Process
Speaker: John Smith
Content: "Need final approval from CEO"
AI Action: Decision maker identified
Icon: 👔
```

### 6. Agreement on Next Steps (42:15)
```
Type: Positive Conclusion
Speaker: Alex Rodriguez
Content: "This is great progress"
Sentiment: 92% (Very Positive)
Icon: ✅
```

---

## ✅ ACTION ITEMS (4)

### 1. Send Updated Proposal
```
Mentioned: 40:25
Speaker: Alex Rodriguez
Assigned: Alex Rodriguez
Due: Dec 10, 2024
Status: ✅ Completed
```

### 2. Address Salesforce Integration Details
```
Mentioned: 28:45
Speaker: Alex Rodriguez
Assigned: Alex Rodriguez
Due: Dec 12, 2024
Status: ⏳ In Progress
```

### 3. Request Introduction to CEO
```
Mentioned: 36:50
Speaker: Alex Rodriguez → John Smith
Assigned: John Smith
Due: Dec 15, 2024
Status: ⏳ Pending
```

### 4. Schedule Technical Demo
```
Mentioned: 41:10
Speaker: John Smith → Alex Rodriguez
Assigned: Sarah Chen
Due: Dec 18, 2024
Status: ⏳ Pending
```

---

## 📈 SENTIMENT DISTRIBUTION

| Sentiment | Percentage | Duration | Visual |
|-----------|-----------|----------|--------|
| 😊 Positive | 75% | 34 minutes | Green |
| 😐 Neutral | 20% | 9 minutes | Yellow |
| ☹️ Negative | 5% | 2 minutes | Red |

### Timeline Breakdown:
```
00:00 - 10:00: Positive (90%)
10:01 - 25:00: Positive (85%)
25:01 - 35:00: Neutral (60%) - Integration concerns discussed
35:01 - 45:00: Positive (88%)
```

---

## 📝 TRANSCRIPT SEGMENTS (20 Total)

### Segment Types:
- **Normal:** 10 segments
- **Key Moments:** 6 segments
- **Action Items:** 4 segments

### Sample Segments:

#### 00:00 - Opening (Normal)
```
Speaker: Alex Rodriguez
Text: "Good morning, John! Thanks for joining the call today. I'm excited
      to walk through the proposal we put together for Acme Corp."
Type: Normal
```

#### 05:30 - Budget Discussion (Key Moment)
```
Speaker: John Smith
Text: "Okay, so the annual cost would be $50,000. That's actually within
      our budget range. We had allocated up to $55K for this, so this
      works perfectly."
Type: Key Moment
Moment Type: Budget
AI Detections:
  • Budget confirmed at $50,000
  • CRM Updated: Deal amount confirmed
```

#### 22:10 - Integration Concerns (Key Moment)
```
Speaker: John Smith
Text: "Now, the big question on my end is the Salesforce integration.
      We're heavily invested in Salesforce, and we can't afford any
      disruption to that system. How does your platform handle that
      integration?"
Type: Key Moment
Moment Type: Integration
AI Detections:
  • Concern about Salesforce integration
  • Competitor identified: Salesforce
  • CRM Updated: Competitor added to deal
```

#### 28:45 - Follow-up Action (Action Item)
```
Speaker: Alex Rodriguez
Text: "Absolutely. I'll send you our integration guide and we can also
      schedule a technical deep-dive if you'd like."
Type: Action Item
AI Created Task:
  • Task: Address Salesforce integration details
  • Assigned: Alex Rodriguez
  • Due: Dec 12, 2024
  • Status: In Progress
```

---

## 🗄️ SUPABASE DATABASE SCHEMA

### Table: `meeting_transcripts`
```sql
CREATE TABLE meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  total_words INTEGER NOT NULL,
  duration INTEGER NOT NULL, -- minutes
  average_wpm INTEGER NOT NULL,
  speaker_count INTEGER NOT NULL,
  ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
  language TEXT DEFAULT 'English (US)',
  processed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view transcripts of their meetings"
  ON meeting_transcripts FOR SELECT
  TO authenticated
  USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE user_id = auth.uid()
    )
  );
```

### Table: `transcript_speakers`
```sql
CREATE TABLE transcript_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES meeting_transcripts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  speaking_time INTEGER NOT NULL, -- minutes
  speaking_percentage INTEGER CHECK (speaking_percentage >= 0 AND speaking_percentage <= 100),
  word_count INTEGER NOT NULL,
  sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE transcript_speakers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view speakers of their transcripts"
  ON transcript_speakers FOR SELECT
  TO authenticated
  USING (
    transcript_id IN (
      SELECT id FROM meeting_transcripts mt
      JOIN meetings m ON mt.meeting_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );
```

### Table: `transcript_key_moments`
```sql
CREATE TABLE transcript_key_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES meeting_transcripts(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  time_seconds INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'financial', 'sentiment', 'timeline', 'objection', 'decision', 'conclusion'
  speaker TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment INTEGER CHECK (sentiment >= 0 AND sentiment <= 100),
  ai_action TEXT,
  icon TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE transcript_key_moments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view key moments of their transcripts"
  ON transcript_key_moments FOR SELECT
  TO authenticated
  USING (
    transcript_id IN (
      SELECT id FROM meeting_transcripts mt
      JOIN meetings m ON mt.meeting_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

-- Index for ordering
CREATE INDEX idx_key_moments_sequence ON transcript_key_moments(transcript_id, sequence_order);
```

### Table: `transcript_action_items`
```sql
CREATE TABLE transcript_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES meeting_transcripts(id) ON DELETE CASCADE,
  mentioned_at TEXT NOT NULL,
  time_seconds INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  task TEXT NOT NULL,
  assignee TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'completed', 'in-progress', 'pending'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE transcript_action_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view action items of their transcripts"
  ON transcript_action_items FOR SELECT
  TO authenticated
  USING (
    transcript_id IN (
      SELECT id FROM meeting_transcripts mt
      JOIN meetings m ON mt.meeting_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update action items of their transcripts"
  ON transcript_action_items FOR UPDATE
  TO authenticated
  USING (
    transcript_id IN (
      SELECT id FROM meeting_transcripts mt
      JOIN meetings m ON mt.meeting_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );
```

### Table: `transcript_segments`
```sql
CREATE TABLE transcript_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES meeting_transcripts(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  time_seconds INTEGER NOT NULL,
  speaker TEXT NOT NULL,
  speaker_initials TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'key-moment', 'action-item'
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  moment_type TEXT, -- 'budget', 'timeline', 'integration', 'decision', 'agreement', 'sentiment'
  moment_title TEXT,
  ai_detections JSONB,
  action_item JSONB,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view segments of their transcripts"
  ON transcript_segments FOR SELECT
  TO authenticated
  USING (
    transcript_id IN (
      SELECT id FROM meeting_transcripts mt
      JOIN meetings m ON mt.meeting_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

-- Index for ordering and search
CREATE INDEX idx_segments_sequence ON transcript_segments(transcript_id, sequence_order);
CREATE INDEX idx_segments_search ON transcript_segments USING gin(to_tsvector('english', text));
```

### Table: `transcript_sentiment_timeline`
```sql
CREATE TABLE transcript_sentiment_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES meeting_transcripts(id) ON DELETE CASCADE,
  time_range TEXT NOT NULL,
  sentiment TEXT NOT NULL,
  percentage INTEGER CHECK (percentage >= 0 AND percentage <= 100),
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE transcript_sentiment_timeline ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view sentiment timeline of their transcripts"
  ON transcript_sentiment_timeline FOR SELECT
  TO authenticated
  USING (
    transcript_id IN (
      SELECT id FROM meeting_transcripts mt
      JOIN meetings m ON mt.meeting_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );
```

---

## 🔍 QUERY EXAMPLES

### Get Complete Transcript
```typescript
import { supabase } from './lib/supabase';

async function getTranscript(meetingId: string) {
  const { data: transcript, error } = await supabase
    .from('meeting_transcripts')
    .select(`
      *,
      speakers:transcript_speakers(*),
      key_moments:transcript_key_moments(*),
      action_items:transcript_action_items(*),
      segments:transcript_segments(*),
      sentiment_timeline:transcript_sentiment_timeline(*)
    `)
    .eq('meeting_id', meetingId)
    .single();

  return transcript;
}
```

### Search Transcript
```typescript
async function searchTranscript(transcriptId: string, query: string) {
  const { data: segments, error } = await supabase
    .from('transcript_segments')
    .select('*')
    .eq('transcript_id', transcriptId)
    .textSearch('text', query)
    .order('sequence_order');

  return segments;
}
```

### Get Action Items by Status
```typescript
async function getActionItemsByStatus(transcriptId: string, status: string) {
  const { data: items, error } = await supabase
    .from('transcript_action_items')
    .select('*')
    .eq('transcript_id', transcriptId)
    .eq('status', status)
    .order('due_date');

  return items;
}
```

### Update Action Item Status
```typescript
async function updateActionItemStatus(itemId: string, status: string) {
  const { data, error } = await supabase
    .from('transcript_action_items')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .select()
    .single();

  return data;
}
```

---

## 📊 JSON EXAMPLES

### AI Detections (JSONB)
```json
[
  "Budget confirmed: $50,000",
  "CRM Updated: Deal amount confirmed"
]
```

### Action Item (JSONB)
```json
{
  "task": "Send Salesforce integration documentation",
  "assignee": "Alex Rodriguez",
  "dueDate": "Dec 12, 2024",
  "status": "in-progress"
}
```

---

## 🎯 DATA VALIDATION RULES

### Constraints:
- AI Confidence: 0-100
- Speaking Percentage: 0-100
- Sentiment Score: 0-100
- Duration: > 0 minutes
- Word Count: > 0
- Time Seconds: >= 0

### Required Fields:
- Meeting ID (foreign key)
- Speaker name and initials
- Timestamp and time_seconds
- Transcript text
- Segment type
- Sequence order

### Enums:
- **Segment Type:** normal, key-moment, action-item
- **Sentiment:** positive, neutral, negative
- **Moment Type:** budget, timeline, integration, decision, agreement, sentiment
- **Key Moment Type:** financial, sentiment, timeline, objection, decision, conclusion
- **Action Status:** completed, in-progress, pending

---

## 🔐 SECURITY (RLS Policies)

All tables have Row Level Security enabled:

1. **SELECT:** Users can only view transcripts from their own meetings
2. **UPDATE:** Users can update action item status in their transcripts
3. **DELETE:** Cascade delete when meeting is deleted
4. **INSERT:** (When implemented) Users can only create transcripts for their meetings

---

## 📈 ANALYTICS QUERIES

### Speaker Talk Time Distribution
```sql
SELECT
  name,
  speaking_time,
  speaking_percentage,
  sentiment_score
FROM transcript_speakers
WHERE transcript_id = ?
ORDER BY speaking_time DESC;
```

### Sentiment Over Time
```sql
SELECT
  time_range,
  sentiment,
  percentage
FROM transcript_sentiment_timeline
WHERE transcript_id = ?
ORDER BY sequence_order;
```

### Key Moments Summary
```sql
SELECT
  type,
  COUNT(*) as count,
  AVG(sentiment) as avg_sentiment
FROM transcript_key_moments
WHERE transcript_id = ?
GROUP BY type;
```

### Action Items Status
```sql
SELECT
  status,
  COUNT(*) as count,
  STRING_AGG(assignee, ', ') as assignees
FROM transcript_action_items
WHERE transcript_id = ?
GROUP BY status;
```

---

## 🚀 FUTURE ENHANCEMENTS

### Phase 1 (Current): Mock Data
- ✅ Complete TypeScript interface
- ✅ Sample transcript data
- ✅ Helper functions for filtering/search
- ✅ React component integration

### Phase 2: Database Integration
- [ ] Create Supabase tables
- [ ] Implement RLS policies
- [ ] Create indexes for performance
- [ ] Set up foreign key constraints

### Phase 3: AI Processing
- [ ] Real-time transcription API
- [ ] Sentiment analysis engine
- [ ] Key moment detection
- [ ] Action item extraction
- [ ] Speaker diarization

### Phase 4: Advanced Features
- [ ] Multi-language support
- [ ] Custom vocabulary training
- [ ] Real-time transcript during calls
- [ ] Automatic CRM updates
- [ ] Task integration (sync to task management)

---

## 📚 RELATED DOCUMENTATION

- `MEETING_TRANSCRIPT_VIEWER_TEST_REPORT.md` - Full test report
- `TRANSCRIPT_VIEWER_QUICK_TEST.md` - Quick test guide
- `/src/utils/meetingTranscriptMockData.ts` - Mock data service
- `/src/pages/CRM/MeetingTranscriptViewer.tsx` - React component

---

**Last Updated:** December 21, 2025
**Version:** 1.0.0
**Status:** Production Ready (Mock Data) | Database Ready (Schema Defined)
