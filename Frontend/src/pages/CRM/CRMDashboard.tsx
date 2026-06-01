import React, { useState } from 'react';
import {
  Users, TrendingUp, DollarSign, Target, AlertTriangle,
  Lightbulb, Calendar, Phone, Mail, Video, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { useToast } from '../../contexts/ToastContext';
import PointsBreakdownModal from '../../components/gamification/PointsBreakdownModal';
import LevelInfoPopover from '../../components/gamification/LevelInfoPopover';
import ProgressDetailPopover from '../../components/gamification/ProgressDetailPopover';
import StreakPopover from '../../components/gamification/StreakPopover';
import ChallengeDetailModal from '../../components/gamification/ChallengeDetailModal';
import PointsDetailTooltip from '../../components/gamification/PointsDetailTooltip';

const CRMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [showPointsBreakdown, setShowPointsBreakdown] = useState(false);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [showProgressDetail, setShowProgressDetail] = useState(false);
  const [showStreakPopover, setShowStreakPopover] = useState(false);
  const [showChallengeDetail, setShowChallengeDetail] = useState(false);
  const [showPointsTooltip, setShowPointsTooltip] = useState<{
    show: boolean;
    points: number;
    activityType: string;
    position: { top: number; left: number };
  }>({ show: false, points: 0, activityType: '', position: { top: 0, left: 0 } });

  // Get current date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Sample data
  const metrics = [
    {
      label: 'Contacts',
      value: '147',
      change: '+12 this week',
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Deals',
      value: '23',
      change: '5 closing this week',
      icon: TrendingUp,
      color: 'green'
    },
    {
      label: 'Pipeline',
      value: '$2.4M',
      change: '+$340K this month',
      icon: DollarSign,
      color: 'orange'
    },
    {
      label: 'Target',
      value: '89%',
      change: '↑ 4% this month',
      icon: Target,
      color: 'indigo'
    }
  ];

  const aiInsights = [
    {
      icon: AlertTriangle,
      message: '3 deals need attention - No activity in 5 days',
      action: 'View Deals',
      type: 'warning'
    },
    {
      icon: Lightbulb,
      message: '2 high-value leads from HRMS ready to contact',
      action: 'View Leads',
      type: 'info'
    },
    {
      icon: TrendingUp,
      message: 'Your close rate is up 12% this month - Great job!',
      action: null,
      type: 'success'
    }
  ];

  const pipelineStages = [
    { stage: 'Prospecting', leads: 45, value: '$890K', percentage: 100, leadGenCount: 30 },
    { stage: 'Qualified', leads: 23, value: '$650K', percentage: 73, leadGenCount: 15 },
    { stage: 'Proposal', leads: 15, value: '$480K', percentage: 54, leadGenCount: 8 },
    { stage: 'Negotiation', leads: 8, value: '$320K', percentage: 36, leadGenCount: 5 },
    { stage: 'Closed-Won', leads: 4, value: '$180K', percentage: 20, leadGenCount: 2 }
  ];

  const recentActivities = [
    {
      date: 'Nov 15, 2:00 PM',
      type: 'meeting',
      icon: Video,
      title: 'Meeting: Acme Corp Product Demo',
      subtitle: 'AI Notes taken and auto-filled CRM',
      action: 'View Details',
      hasAI: true,
      points: 25
    },
    {
      date: 'Nov 14, 3:15 PM',
      type: 'email',
      icon: Mail,
      title: 'Email: Sent proposal to TechStart',
      subtitle: 'Status: Opened (Nov 14, 4:23 PM)',
      action: 'View Email',
      hasAI: false,
      points: 5
    },
    {
      date: 'Nov 14, 10:30 AM',
      type: 'call',
      icon: Phone,
      title: 'Call: BigCo - Discovery call (15 mins)',
      subtitle: '',
      action: 'View Details',
      hasAI: false,
      points: 10
    }
  ];

  const gamificationData = {
    userPerformance: {
      points: 38450,
      rank: 2,
      rankChange: 'up',
      level: 4,
      levelName: 'Platinum',
      levelProgress: 87,
      badges: 5,
      streak: 23,
      coins: 10
    },
    dailyChallenge: {
      title: 'Make 15 calls',
      current: 8,
      target: 15,
      progress: 53,
      reward: 200,
      timeRemaining: '6h 32m'
    },
    teamCelebrations: [
      {
        name: 'Sarah',
        achievement: 'closed $120K deal',
        points: 1200,
        time: '2h ago'
      },
      {
        name: 'Mike',
        achievement: 'earned HRMS Master',
        badge: true,
        time: '5h ago'
      },
      {
        name: 'Emily',
        achievement: 'leveled up to Gold',
        levelUp: true,
        time: 'Yesterday'
      }
    ]
  };

  const upcomingMeetings = [
    {
      day: 'TODAY',
      time: '2:00 PM',
      title: 'TechStart Discovery Call',
      contact: 'Sarah Lee (CFO)',
      aiEnabled: true
    },
    {
      day: 'TOMORROW',
      time: '10:00 AM',
      title: 'Acme Corp Follow-up',
      contact: 'John Smith (VP Sales)',
      aiEnabled: true
    }
  ];

  const topDeals = [
    {
      company: 'Acme Corp',
      value: '$50K',
      stage: 'Proposal',
      score: 78,
      next: 'Send proposal by Nov 18'
    },
    {
      company: 'TechStart',
      value: '$42K',
      stage: 'Negotiation',
      score: 85,
      next: 'Schedule contract review'
    },
    {
      company: 'BigCo',
      value: '$75K',
      stage: 'Qualified',
      score: 72,
      next: 'Send demo recording'
    }
  ];

  // Navigation handlers
  const handleMetricClick = (metric: string) => {
    switch (metric) {
      case 'Contacts':
        navigate('/crm/contacts');
        break;
      case 'Deals':
        navigate('/crm/deals');
        break;
      case 'Pipeline':
        navigate('/crm/pipeline');
        break;
      case 'Target':
        navigate('/analytics');
        break;
    }
  };

  const handleAIInsightClick = (type: string) => {
    switch (type) {
      case 'deals-attention':
        navigate('/crm/deals?filter=needs-attention');
        break;
      case 'leads-hrms':
        navigate('/crm/leads?filter=hrms-source');
        break;
    }
  };

  const handleActivityClick = (activityType: string, activityId: string) => {
    if (activityType === 'email') {
      // Show email modal (for now, navigate to activities)
      navigate('/crm/activities');
    } else {
      navigate('/crm/activities');
    }
  };

  const handleMeetingClick = (meetingDay: string, action: 'join' | 'details') => {
    if (action === 'join') {
      // Open meeting link in new tab
      window.open('https://meet.google.com/sample-meeting-link', '_blank');
    } else {
      navigate('/calendar');
    }
  };

  const handleDealClick = (dealIndex: number) => {
    // For now, navigate to deals list. Later can navigate to specific deal
    navigate('/crm/deals');
  };

  // Gamification data structures
  const pointsBreakdownData = {
    dealsClosedPoints: 25000,
    activitiesPoints: 8450,
    challengesPoints: 3000,
    bonusPoints: 2000,
    total: 38450
  };

  const levelInfoData = {
    number: 4,
    name: 'Platinum',
    minPoints: 30000,
    maxPoints: 49999,
    perks: ['Early lead access', 'Flexible schedule', 'Priority support'],
    nextLevel: {
      name: 'Diamond',
      points: 50000
    }
  };

  const progressDetailData = {
    currentPoints: 38450,
    nextLevelPoints: 50000,
    remainingPoints: 11550,
    daysToNextLevel: 14
  };

  const streakData = {
    current: 23,
    longest: 45,
    nextMilestone: {
      days: 30,
      points: 250,
      daysRemaining: 7
    }
  };

  const challengeDetailData = {
    icon: '📞',
    name: 'Daily Dialer',
    description: 'Make 15 calls today',
    current: 8,
    target: 15,
    progress: 53,
    calls: [
      { time: '10:30 AM', contact: 'John Smith' },
      { time: '11:15 AM', contact: 'Sarah Johnson' },
      { time: '11:45 AM', contact: 'Mike Chen' },
      { time: '1:30 PM', contact: 'Emily Brown' },
      { time: '2:00 PM', contact: 'Alex Davis' },
      { time: '2:30 PM', contact: 'Lisa Wilson' },
      { time: '3:00 PM', contact: 'Tom Anderson' },
      { time: '3:30 PM', contact: 'Jane Miller' }
    ],
    reward: 200,
    timeRemaining: '6h 32m'
  };

  // Gamification interaction handlers
  const handlePerformanceWidgetClick = () => {
    showToast('Loading leaderboard...', 'info');
    setTimeout(() => navigate('/crm/gamification/leaderboard'), 300);
  };

  const handlePointsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPointsBreakdown(true);
  };

  const handleRankClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast('Loading leaderboard...', 'info');
    setTimeout(() => navigate('/crm/gamification/leaderboard'), 300);
  };

  const handleLevelBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLevelInfo(true);
  };

  const handleProgressBarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProgressDetail(true);
  };

  const handleBadgesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/crm/gamification/achievements');
  };

  const handleStreakClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStreakPopover(true);
  };

  const handleDealsIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/crm/deals?filter=closed-this-quarter');
  };

  const handleChallengeWidgetClick = () => {
    showToast('Loading challenges...', 'info');
    setTimeout(() => navigate('/crm/gamification/challenges'), 300);
  };

  const handleChallengeNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowChallengeDetail(true);
  };

  const handleCelebrationClick = (celebration: any) => {
    if (celebration.points) {
      navigate(`/crm/deals/deal_sarah_120k`);
      showToast('Loading deal...', 'info');
    } else if (celebration.badge) {
      navigate('/crm/gamification/achievements');
    } else if (celebration.levelUp) {
      navigate('/crm/gamification/profile/user_4');
    }
  };

  const handleCelebrationUserClick = (e: React.MouseEvent, userName: string) => {
    e.stopPropagation();
    const userIdMap: { [key: string]: string } = {
      'Sarah': 'user_1',
      'Mike': 'user_2',
      'Emily': 'user_4'
    };
    showToast(`Loading ${userName}'s profile...`, 'info');
    setTimeout(() => navigate(`/crm/gamification/profile/${userIdMap[userName]}`), 300);
  };

  const handlePointsBadgeClick = (e: React.MouseEvent, points: number, activityType: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setShowPointsTooltip({
      show: true,
      points,
      activityType,
      position: {
        top: rect.bottom,
        left: rect.left + rect.width / 2
      }
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Segoe UI", "Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* CRM Top Navigation */}
      <CRMNavigation />

      {/* Greeting Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#333333', fontSize: '28px' }}>
          👋 Welcome back, Alex!
        </h1>
        <p className="text-gray-600" style={{ fontSize: '14px' }}>Today is {dateString}</p>
      </div>

      <div className="px-8 py-6" style={{ marginTop: '30px' }}>
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {metrics.map((metric, index) => {
            const colors = getColorClasses(metric.color);
            const Icon = metric.icon;
            return (
              <div
                key={index}
                onClick={() => handleMetricClick(metric.label)}
                className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1`}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-8 w-8 ${colors.text}`} />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-600">
                  {metric.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Insights Section */}
        <div className="rounded-xl p-6 mb-8 text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)' }}>
          <h2 className="font-bold mb-4 flex items-center" style={{ fontSize: '24px' }}>
            <span className="mr-2">🤖</span> AI Insights for You
          </h2>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300"
                  style={{ borderRadius: '10px' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <Icon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-white">{insight.message}</span>
                    </div>
                    {insight.action && (
                      <button
                        onClick={() => handleAIInsightClick(insight.type === 'warning' ? 'deals-attention' : 'leads-hrms')}
                        className="ml-4 px-4 py-1 bg-white rounded-md text-sm font-medium flex-shrink-0 hover:shadow-md transition-all duration-200"
                        style={{ color: '#667eea' }}
                      >
                        {insight.action}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gamification Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Your Performance Card */}
          <div
            className="relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg cursor-pointer transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transform: 'translateY(0)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={handlePerformanceWidgetClick}
          >
            <div className="flex items-center mb-4" onClick={handlePerformanceWidgetClick}>
              <span className="text-2xl mr-2">🏆</span>
              <h3 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>YOUR PERFORMANCE</h3>
            </div>

            <div className="mb-4">
              <div
                className="text-3xl font-bold mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: '#667eea', fontSize: '28px' }}
                onClick={handlePointsClick}
              >
                {gamificationData.userPerformance.points.toLocaleString()} pts
              </div>
              <div
                className="flex items-center text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: '#28a745' }}
                onClick={handleRankClick}
              >
                <span className="font-bold" style={{ color: '#333333' }}>Rank #{gamificationData.userPerformance.rank}</span>
                <span className="ml-1">↑</span>
              </div>
            </div>

            <div
              className="mb-4 p-3 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#667eea' }}
              onClick={handleLevelBadgeClick}
            >
              <div className="flex items-center justify-center">
                <span className="text-white font-bold" style={{ fontSize: '14px' }}>
                  💎 L{gamificationData.userPerformance.level} {gamificationData.userPerformance.levelName}
                </span>
              </div>
            </div>

            <div
              className="mb-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProgressBarClick}
            >
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1" style={{ fontSize: '12px' }}>
                <span>{gamificationData.userPerformance.levelProgress}% to Diamond</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full" style={{ height: '8px' }}>
                <div
                  className="rounded-full"
                  style={{
                    height: '8px',
                    width: `${gamificationData.userPerformance.levelProgress}%`,
                    background: '#667eea'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4" style={{ fontSize: '14px' }}>
              <span
                className="font-medium cursor-pointer hover:scale-105 transition-transform"
                onClick={handleBadgesClick}
              >
                {gamificationData.userPerformance.badges} 🏅
              </span>
              <span
                className="font-medium cursor-pointer hover:scale-105 transition-transform"
                onClick={handleStreakClick}
              >
                {gamificationData.userPerformance.streak}🔥
              </span>
              <span
                className="font-medium cursor-pointer hover:scale-105 transition-transform"
                onClick={handleDealsIconClick}
              >
                {gamificationData.userPerformance.coins}💰
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/crm/gamification/leaderboard');
              }}
              className="w-full py-2 text-center border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#e0e0e0' }}
            >
              Leaderboard
            </button>
          </div>

          {/* Daily Challenge Card */}
          <div
            className="rounded-xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 text-white"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={handleChallengeWidgetClick}
          >
            <div className="flex items-center mb-4" onClick={handleChallengeWidgetClick}>
              <span className="text-2xl mr-2">🎯</span>
              <h3 className="font-bold text-white" style={{ fontSize: '16px' }}>DAILY CHALLENGE</h3>
            </div>

            <div className="mb-4">
              <div
                className="flex items-center mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={handleChallengeNameClick}
              >
                <span className="text-lg mr-2">📞</span>
                <p className="text-lg font-semibold text-white">
                  {gamificationData.dailyChallenge.title}
                </p>
              </div>

              <div className="mb-2 cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-center justify-between text-sm text-white mb-1">
                  <span>{gamificationData.dailyChallenge.current} / {gamificationData.dailyChallenge.target} calls</span>
                  <span className="font-medium">{gamificationData.dailyChallenge.progress}%</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-white transition-all duration-500"
                    style={{ width: `${gamificationData.dailyChallenge.progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">🎁</span>
                  <span className="text-sm font-medium text-white">Reward:</span>
                </div>
                <span className="text-lg font-bold text-white">
                  +{gamificationData.dailyChallenge.reward} points
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center p-3 bg-white/10 rounded-lg mb-4">
              <span className="text-sm font-medium text-white/90">
                ⏱️ {gamificationData.dailyChallenge.timeRemaining} remaining
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/crm/gamification/challenges');
              }}
              className="w-full py-2 text-center bg-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200"
              style={{ color: '#667eea' }}
            >
              View All
            </button>
          </div>

          {/* Team Celebrations Card */}
          <div
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg cursor-pointer transition-all duration-300"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transform: 'translateY(0)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => {
              showToast('Loading leaderboard...', 'info');
              setTimeout(() => navigate('/crm/gamification/leaderboard'), 300);
            }}
          >
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🎉</span>
              <h3 className="font-bold text-gray-900" style={{ fontSize: '16px' }}>TEAM CELEBRATIONS</h3>
            </div>

            <div className="space-y-3">
              {gamificationData.teamCelebrations.map((celebration, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 pb-3 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-all duration-200 -mx-2 px-2 py-2 rounded"
                  style={{ borderLeft: '3px solid transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderLeftColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderLeftColor = 'transparent';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCelebrationClick(celebration);
                  }}
                >
                  <div className="flex items-start">
                    <span className="text-lg mr-2">
                      {celebration.points ? '💰' : celebration.badge ? '🏅' : '⬆️'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1" style={{ fontSize: '14px' }}>
                        <span
                          className="font-semibold hover:underline cursor-pointer"
                          onClick={(e) => handleCelebrationUserClick(e, celebration.name)}
                        >
                          {celebration.name}
                        </span>{' '}
                        {celebration.achievement}
                      </p>
                      {celebration.points && (
                        <div className="text-xs font-bold mb-1" style={{ color: '#667eea', fontSize: '12px' }}>
                          +{celebration.points.toLocaleString()} pts
                        </div>
                      )}
                      <p className="text-xs text-gray-500" style={{ fontSize: '11px' }}>{celebration.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/crm/gamification/leaderboard');
              }}
              className="w-full py-2 text-center border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mt-4"
              style={{ borderColor: '#e0e0e0' }}
            >
              View All
            </button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - 60% */}
          <div className="lg:col-span-3 space-y-6">
            {/* Pipeline by Stage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                  📊 Pipeline by Stage
                </h2>
                <button
                  onClick={() => navigate('/crm/pipeline')}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#667eea' }}
                >
                  View Analysis →
                </button>
              </div>
              <div className="space-y-4 mb-6">
                {pipelineStages.map((stage, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700" style={{ fontSize: '14px' }}>
                        {stage.stage}
                      </span>
                      <div className="flex items-center space-x-3 text-sm text-gray-600" style={{ fontSize: '14px' }}>
                        <span title={`${stage.leadGenCount} from Lead Gen tool`} className="cursor-help">
                          {stage.leads} {stage.leads === 1 ? 'lead' : stage.stage === 'Prospecting' || stage.stage === 'Qualified' ? 'leads' : 'deals'}
                        </span>
                        <span className="font-semibold">{stage.value}</span>
                      </div>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute right-0 top-8 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap" style={{ fontSize: '11px' }}>
                      {stage.leadGenCount} leads from Lead Gen tool
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${stage.percentage}%`,
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#f0f3ff', border: '1px solid #667eea' }}>
                <p className="text-sm" style={{ color: '#333333', fontSize: '14px' }}>
                  <span className="mr-2">🤖</span>
                  <strong>AI Prediction:</strong> 67% probability to close $1.2M this quarter
                </p>
              </div>

              <button
                onClick={() => navigate('/crm/pipeline')}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Full Pipeline
              </button>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 className="font-bold text-gray-900 mb-6 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                ⚡ Recent Activities
              </h2>
              <div className="space-y-4 mb-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                      style={{ borderRadius: '10px' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <div className="p-2 bg-blue-50 rounded-lg mr-4">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1" style={{ fontSize: '12px' }}>{activity.date}</p>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900" style={{ fontSize: '14px' }}>
                                {activity.title}
                              </p>
                              {activity.hasAI && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: '#f0f3ff', color: '#667eea', fontSize: '11px' }}>
                                  🤖 AI Notes
                                </span>
                              )}
                            </div>
                            {activity.subtitle && (
                              <p className="text-xs text-gray-600 mb-2" style={{ fontSize: '12px' }}>{activity.subtitle}</p>
                            )}
                            <div
                              className="inline-flex items-center px-2 py-1 rounded cursor-pointer hover:scale-105 transition-transform"
                              style={{ backgroundColor: 'rgba(102, 126, 234, 0.1)', width: 'fit-content' }}
                              onClick={(e) => handlePointsBadgeClick(e, activity.points, activity.type)}
                            >
                              <span className="text-xs font-bold mr-1" style={{ color: '#667eea', fontSize: '11px' }}>
                                🎮 +{activity.points} points earned
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleActivityClick(activity.type, `activity-${index}`)}
                          className="ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex-shrink-0"
                        >
                          {activity.action}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => navigate('/crm/activities/all')}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Activities
              </button>
            </div>
          </div>

          {/* Right Column - 40% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Meetings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 className="font-bold text-gray-900 mb-6 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                📅 Upcoming Meetings
              </h2>
              <div className="space-y-6 mb-4">
                {upcomingMeetings.map((meeting, index) => (
                  <div key={index}>
                    <p className="text-xs font-semibold text-gray-500 mb-2" style={{ fontSize: '11px' }}>
                      {meeting.day}
                    </p>
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all" style={{ borderRadius: '10px' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900 mb-1" style={{ fontSize: '14px' }}>
                            {meeting.time} - {meeting.title}
                          </p>
                          <p className="text-xs text-gray-600" style={{ fontSize: '12px' }}>
                            Contact: {meeting.contact}
                          </p>
                        </div>
                      </div>
                      {meeting.aiEnabled && (
                        <div className="rounded px-2 py-1 mb-3 inline-block" style={{ backgroundColor: '#f0f3ff' }}>
                          <span className="text-xs font-medium" style={{ color: '#667eea', fontSize: '11px' }}>
                            🤖 AI Note Taker: Enabled
                          </span>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMeetingClick(meeting.day, 'join')}
                          className="flex-1 py-2 text-white rounded-md text-xs font-medium hover:shadow-lg transition-all duration-300"
                          style={{ backgroundColor: '#667eea' }}
                        >
                          {meeting.day === 'TODAY' ? 'Join Meeting' : 'Schedule'}
                        </button>
                        <button
                          onClick={() => handleMeetingClick(meeting.day, 'details')}
                          className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View Calendar
              </button>
            </div>

            {/* Top Deals to Focus On */}
            <div className="bg-white rounded-xl border border-gray-200 p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 className="font-bold text-gray-900 mb-6 flex items-center" style={{ fontSize: '20px', color: '#333333' }}>
                🎯 Top Deals to Focus On
              </h2>
              <div className="space-y-4">
                {topDeals.map((deal, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    style={{ borderRadius: '10px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900" style={{ fontSize: '14px' }}>
                          {index + 1}. {deal.company}
                        </p>
                        <p className="text-lg font-bold" style={{ fontSize: '18px', color: '#667eea' }}>{deal.value}</p>
                      </div>
                      <div className="flex items-center space-x-1 px-2 py-1 rounded" style={{ backgroundColor: '#fff8e1' }} title="AI Score">
                        <Star className="h-3 w-3 fill-yellow-600" style={{ color: '#ffc107' }} />
                        <span className="text-xs font-semibold" style={{ color: '#f57c00', fontSize: '11px' }}>
                          AI: {deal.score}/100
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-600 mb-2">
                      <span className="px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#e8eaf6', color: '#667eea', fontSize: '11px' }}>
                        {deal.stage}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mb-3" style={{ fontSize: '12px' }}>
                      <strong>Next:</strong> {deal.next}
                    </p>
                    <button
                      onClick={() => handleDealClick(index)}
                      className="w-full py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all duration-300"
                      style={{ borderRadius: '8px' }}
                    >
                      View Deal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Modals and Popovers */}
      <PointsBreakdownModal
        isOpen={showPointsBreakdown}
        onClose={() => setShowPointsBreakdown(false)}
        breakdown={pointsBreakdownData}
      />

      <LevelInfoPopover
        isOpen={showLevelInfo}
        onClose={() => setShowLevelInfo(false)}
        level={levelInfoData}
      />

      <ProgressDetailPopover
        isOpen={showProgressDetail}
        onClose={() => setShowProgressDetail(false)}
        progress={progressDetailData}
      />

      <StreakPopover
        isOpen={showStreakPopover}
        onClose={() => setShowStreakPopover(false)}
        streak={streakData}
      />

      <ChallengeDetailModal
        isOpen={showChallengeDetail}
        onClose={() => setShowChallengeDetail(false)}
        challenge={challengeDetailData}
      />

      {showPointsTooltip.show && (
        <PointsDetailTooltip
          isOpen={showPointsTooltip.show}
          onClose={() => setShowPointsTooltip({ ...showPointsTooltip, show: false })}
          points={showPointsTooltip.points}
          activityType={showPointsTooltip.activityType}
          totalPoints={gamificationData.userPerformance.points}
          rank={gamificationData.userPerformance.rank}
          position={showPointsTooltip.position}
        />
      )}
    </div>
  );
};

export default CRMDashboard;
