export type MomentumLevel = 'accelerating' | 'stable' | 'decelerating';
export type SignalStatus  = 'positive' | 'neutral' | 'negative';

export interface MomentumInput {
  responseTimesHours?: number[];     // last 3 two-way response times in hours
  daysSinceLastTwoWay: number;       // days since rep sent AND contact replied
  newStakeholdersLast14Days: number; // count added in last 14 days
  stageDaysVsBenchmark?: number;     // actual_days - benchmark; negative = ahead
  stageBenchmark?: number;           // needed for 20% threshold on Signal 4
  activitiesLast7Days: number;
  activitiesPrior7Days: number;
}

export interface MomentumSignal {
  id: string;
  label: string;
  status: SignalStatus;
  detail: string;
  dataAvailable: boolean;
}

export interface MomentumResult {
  level: MomentumLevel;
  score: number; // -5 to +5
  signals: MomentumSignal[];
}

// ── Individual signal scorers ─────────────────────────────────────────────────

function scoreResponseTrend(times?: number[]): MomentumSignal {
  if (!times || times.length < 2) {
    return {
      id: 'response-trend',
      label: 'Response time trend',
      status: 'neutral',
      detail: 'Awaiting data',
      dataAvailable: false,
    };
  }
  const steps = times.length - 1;
  let faster = 0;
  let slower = 0;
  for (let i = 1; i < times.length; i++) {
    if (times[i] < times[i - 1]) faster++;
    else if (times[i] > times[i - 1]) slower++;
  }
  if (faster === steps) {
    return {
      id: 'response-trend',
      label: 'Response time trend',
      status: 'positive',
      detail: `Getting faster: ${times[0]}h → ${times[times.length - 1]}h`,
      dataAvailable: true,
    };
  }
  if (slower === steps) {
    return {
      id: 'response-trend',
      label: 'Response time trend',
      status: 'negative',
      detail: `Getting slower: ${times[0]}h → ${times[times.length - 1]}h`,
      dataAvailable: true,
    };
  }
  return {
    id: 'response-trend',
    label: 'Response time trend',
    status: 'neutral',
    detail: `Mixed trend: ${times.join('h → ')}h`,
    dataAvailable: true,
  };
}

function scoreTwoWayRecency(days: number): MomentumSignal {
  const status: SignalStatus = days < 3 ? 'positive' : days <= 7 ? 'neutral' : 'negative';
  const detail =
    days < 3  ? `${days} day${days !== 1 ? 's' : ''} ago — active` :
    days <= 7 ? `${days} days ago — watch closely` :
                `${days} days ago — going quiet`;
  return {
    id: 'two-way-recency',
    label: 'Last two-way conversation',
    status,
    detail,
    dataAvailable: true,
  };
}

function scoreNewStakeholders(count: number): MomentumSignal {
  // Asymmetric: presence is positive, absence is neutral — not negative
  return {
    id: 'new-stakeholders',
    label: 'Stakeholder additions (14d)',
    status: count >= 1 ? 'positive' : 'neutral',
    detail: count >= 1 ? `${count} new stakeholder${count > 1 ? 's' : ''} added` : 'No new stakeholders',
    dataAvailable: true,
  };
}

function scoreStageVsBenchmark(delta?: number, benchmark?: number): MomentumSignal {
  if (delta == null) {
    return {
      id: 'stage-benchmark',
      label: 'Stage progression speed',
      status: 'neutral',
      detail: 'Awaiting benchmark data',
      dataAvailable: false,
    };
  }
  if (delta < 0) {
    return {
      id: 'stage-benchmark',
      label: 'Stage progression speed',
      status: 'positive',
      detail: `${Math.abs(delta)}d ahead of benchmark`,
      dataAvailable: true,
    };
  }
  if (delta === 0) {
    return {
      id: 'stage-benchmark',
      label: 'Stage progression speed',
      status: 'neutral',
      detail: 'On pace with benchmark',
      dataAvailable: true,
    };
  }
  // Positive delta = behind; check 20% threshold if benchmark provided
  const threshold = benchmark != null ? benchmark * 0.2 : 0;
  const status: SignalStatus = delta <= threshold ? 'neutral' : 'negative';
  const detail = status === 'neutral'
    ? `${delta}d behind — within 20% tolerance`
    : `${delta}d behind benchmark`;
  return {
    id: 'stage-benchmark',
    label: 'Stage progression speed',
    status,
    detail,
    dataAvailable: true,
  };
}

function scoreActivityTrend(last7: number, prior7: number): MomentumSignal {
  const status: SignalStatus = last7 > prior7 ? 'positive' : last7 < prior7 ? 'negative' : 'neutral';
  const detail =
    last7 > prior7 ? `${last7} vs ${prior7} prior week — ramping up` :
    last7 < prior7 ? `${last7} vs ${prior7} prior week — dropping off` :
                     `${last7} vs ${prior7} prior week — steady`;
  return {
    id: 'activity-trend',
    label: 'Activity frequency (7d trend)',
    status,
    detail,
    dataAvailable: true,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

function signalScore(s: MomentumSignal): number {
  return s.status === 'positive' ? 1 : s.status === 'negative' ? -1 : 0;
}

export function computeMomentum(input: MomentumInput): MomentumResult {
  const signals: MomentumSignal[] = [
    scoreResponseTrend(input.responseTimesHours),
    scoreTwoWayRecency(input.daysSinceLastTwoWay),
    scoreNewStakeholders(input.newStakeholdersLast14Days),
    scoreStageVsBenchmark(input.stageDaysVsBenchmark, input.stageBenchmark),
    scoreActivityTrend(input.activitiesLast7Days, input.activitiesPrior7Days),
  ];

  const score = signals.reduce((sum, s) => sum + signalScore(s), 0);
  const level: MomentumLevel =
    score >= 2  ? 'accelerating' :
    score <= -2 ? 'decelerating' :
                  'stable';

  return { level, score, signals };
}
