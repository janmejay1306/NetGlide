import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Clock, TrendingUp, ExternalLink,
  StickyNote, Plus, X, Trash2, BarChart3, Activity,
  GraduationCap, Briefcase, FlaskConical, PenTool,
  Megaphone, Lightbulb, Eye, Timer, ChevronRight,
  Sparkles, Target, Star, Calendar,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}

interface DashboardNote {
  id: string;
  text: string;
  createdAt: number;
  color: string;
}


interface PersonalizedDashboardProps {
  profession: string;
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  schedules?: any[];
  onAddSchedule?: (item: any) => void;
  onRemoveSchedule?: (id: string) => void;
}

// ── Profession-specific data ─────────────────────────────────────
interface ProfessionConfig {
  label: string;
  icon: any;
  gradient: string;
  accentColor: string;
  bgGlow: string;
  suggestedSites: { name: string; url: string; description: string }[];
  notePrompt: string;
  trackingLabel: string;
  categories: string[];
}

const PROFESSION_CONFIGS: Record<string, ProfessionConfig> = {
  student: {
    label: 'Student',
    icon: GraduationCap,
    gradient: 'from-cyan-500 to-blue-600',
    accentColor: 'text-cyan-400',
    bgGlow: 'from-cyan-500/10 to-blue-500/5',
    suggestedSites: [
      { name: 'Khan Academy', url: 'https://khanacademy.org', description: 'Free courses on math, science, and more' },
      { name: 'Coursera', url: 'https://coursera.org', description: 'University courses from top institutions' },
      { name: 'edX', url: 'https://edx.org', description: 'Harvard & MIT free courses' },
      { name: 'Quizlet', url: 'https://quizlet.com', description: 'Flashcards and study sets' },
      { name: 'Notion', url: 'https://notion.so', description: 'All-in-one workspace for notes' },
      { name: 'Wolfram Alpha', url: 'https://wolframalpha.com', description: 'Computational knowledge engine' },
      { name: 'Google Scholar', url: 'https://scholar.google.com', description: 'Search academic papers' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', description: 'Q&A for programming questions' },
    ],
    notePrompt: 'Add study notes, reminders, or key concepts...',
    trackingLabel: 'Study Hours',
    categories: ['Education', 'Research', 'Practice'],
  },
  designer: {
    label: 'Designer',
    icon: PenTool,
    gradient: 'from-pink-500 to-orange-400',
    accentColor: 'text-pink-400',
    bgGlow: 'from-pink-500/10 to-orange-500/5',
    suggestedSites: [
      { name: 'Dribbble', url: 'https://dribbble.com', description: 'Design inspiration and portfolios' },
      { name: 'Behance', url: 'https://behance.net', description: 'Showcase creative projects' },
      { name: 'Figma', url: 'https://figma.com', description: 'Collaborative design tool' },
      { name: 'Awwwards', url: 'https://awwwards.com', description: 'Best web design awards' },
      { name: 'Pinterest', url: 'https://pinterest.com', description: 'Visual inspiration boards' },
      { name: 'Coolors', url: 'https://coolors.co', description: 'Color palette generator' },
      { name: 'Unsplash', url: 'https://unsplash.com', description: 'Free high-res stock photos' },
      { name: 'Typewolf', url: 'https://typewolf.com', description: 'Typography inspiration' },
    ],
    notePrompt: 'Design ideas, color palettes, UI patterns...',
    trackingLabel: 'Creative Hours',
    categories: ['Inspiration', 'Tools', 'Resources'],
  },
  researcher: {
    label: 'Researcher',
    icon: FlaskConical,
    gradient: 'from-emerald-500 to-teal-500',
    accentColor: 'text-emerald-400',
    bgGlow: 'from-emerald-500/10 to-teal-500/5',
    suggestedSites: [
      { name: 'Google Scholar', url: 'https://scholar.google.com', description: 'Search academic literature' },
      { name: 'arXiv', url: 'https://arxiv.org', description: 'Pre-print research papers' },
      { name: 'ResearchGate', url: 'https://researchgate.net', description: 'Academic social network' },
      { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', description: 'Biomedical literature database' },
      { name: 'Semantic Scholar', url: 'https://semanticscholar.org', description: 'AI-powered research tool' },
      { name: 'JSTOR', url: 'https://jstor.org', description: 'Digital library of journals' },
      { name: 'Zotero', url: 'https://zotero.org', description: 'Reference management' },
      { name: 'Connected Papers', url: 'https://connectedpapers.com', description: 'Visual paper exploration' },
    ],
    notePrompt: 'Research hypotheses, paper notes, methodology ideas...',
    trackingLabel: 'Research Hours',
    categories: ['Literature', 'Data', 'Writing'],
  },
  tech: {
    label: 'Developer',
    icon: Briefcase,
    gradient: 'from-violet-500 to-purple-500',
    accentColor: 'text-violet-400',
    bgGlow: 'from-violet-500/10 to-purple-500/5',
    suggestedSites: [
      { name: 'GitHub', url: 'https://github.com', description: 'Code hosting and collaboration' },
      { name: 'Stack Overflow', url: 'https://stackoverflow.com', description: 'Programming Q&A community' },
      { name: 'Dev.to', url: 'https://dev.to', description: 'Developer blog platform' },
      { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'Web development reference' },
      { name: 'npm', url: 'https://npmjs.com', description: 'JavaScript package registry' },
      { name: 'Hacker News', url: 'https://news.ycombinator.com', description: 'Tech news and discussions' },
      { name: 'CodePen', url: 'https://codepen.io', description: 'Frontend code playground' },
      { name: 'LeetCode', url: 'https://leetcode.com', description: 'Coding challenges' },
    ],
    notePrompt: 'Code snippets, bug notes, architecture ideas...',
    trackingLabel: 'Coding Hours',
    categories: ['Development', 'Learning', 'Debugging'],
  },
  finance: {
    label: 'Finance',
    icon: TrendingUp,
    gradient: 'from-amber-500 to-yellow-500',
    accentColor: 'text-amber-400',
    bgGlow: 'from-amber-500/10 to-yellow-500/5',
    suggestedSites: [
      { name: 'Bloomberg', url: 'https://bloomberg.com', description: 'Global financial news' },
      { name: 'Yahoo Finance', url: 'https://finance.yahoo.com', description: 'Stock quotes and market data' },
      { name: 'MarketWatch', url: 'https://marketwatch.com', description: 'Real-time market insights' },
      { name: 'Investopedia', url: 'https://investopedia.com', description: 'Financial education' },
      { name: 'CNBC', url: 'https://cnbc.com', description: 'Business news channel' },
      { name: 'TradingView', url: 'https://tradingview.com', description: 'Advanced charting' },
      { name: 'Morningstar', url: 'https://morningstar.com', description: 'Investment research' },
      { name: 'Seeking Alpha', url: 'https://seekingalpha.com', description: 'Stock analysis & news' },
    ],
    notePrompt: 'Market notes, investment ideas, analysis...',
    trackingLabel: 'Market Hours',
    categories: ['Markets', 'Analysis', 'News'],
  },
  marketer: {
    label: 'Marketer',
    icon: Megaphone,
    gradient: 'from-rose-500 to-pink-500',
    accentColor: 'text-rose-400',
    bgGlow: 'from-rose-500/10 to-pink-500/5',
    suggestedSites: [
      { name: 'HubSpot Blog', url: 'https://blog.hubspot.com', description: 'Marketing insights & tips' },
      { name: 'Google Trends', url: 'https://trends.google.com', description: 'Search trend analysis' },
      { name: 'Canva', url: 'https://canva.com', description: 'Design tool for marketers' },
      { name: 'Mailchimp', url: 'https://mailchimp.com', description: 'Email marketing platform' },
      { name: 'Buffer', url: 'https://buffer.com', description: 'Social media management' },
      { name: 'SEMrush', url: 'https://semrush.com', description: 'SEO & competitive analysis' },
      { name: 'Hootsuite', url: 'https://hootsuite.com', description: 'Social media scheduling' },
      { name: 'Neil Patel', url: 'https://neilpatel.com', description: 'Digital marketing blog' },
    ],
    notePrompt: 'Campaign ideas, content calendars, KPIs...',
    trackingLabel: 'Marketing Hours',
    categories: ['Strategy', 'Content', 'Analytics'],
  },
  entrepreneur: {
    label: 'Entrepreneur',
    icon: Lightbulb,
    gradient: 'from-orange-500 to-red-500',
    accentColor: 'text-orange-400',
    bgGlow: 'from-orange-500/10 to-red-500/5',
    suggestedSites: [
      { name: 'Y Combinator', url: 'https://ycombinator.com', description: 'Startup accelerator resources' },
      { name: 'Product Hunt', url: 'https://producthunt.com', description: 'Discover new products' },
      { name: 'Indie Hackers', url: 'https://indiehackers.com', description: 'Startup community' },
      { name: 'AngelList', url: 'https://angel.co', description: 'Startup jobs & investing' },
      { name: 'Crunchbase', url: 'https://crunchbase.com', description: 'Company & funding data' },
      { name: 'Stripe Atlas', url: 'https://stripe.com/atlas', description: 'Start a company anywhere' },
      { name: 'TechCrunch', url: 'https://techcrunch.com', description: 'Startup news & analysis' },
      { name: 'First Round Review', url: 'https://review.firstround.com', description: 'Startup advice articles' },
    ],
    notePrompt: 'Business ideas, growth strategies, funding...',
    trackingLabel: 'Hustle Hours',
    categories: ['Ideas', 'Growth', 'Networking'],
  },
};

const DEFAULT_CONFIG: ProfessionConfig = {
  label: 'Explorer',
  icon: Globe,
  gradient: 'from-purple-500 to-blue-500',
  accentColor: 'text-purple-400',
  bgGlow: 'from-purple-500/10 to-blue-500/5',
  suggestedSites: [
    { name: 'Wikipedia', url: 'https://wikipedia.org', description: 'Free encyclopedia' },
    { name: 'Reddit', url: 'https://reddit.com', description: 'Front page of the internet' },
    { name: 'Medium', url: 'https://medium.com', description: 'Read and share ideas' },
    { name: 'YouTube', url: 'https://youtube.com', description: 'Video platform' },
  ],
  notePrompt: 'Jot down your thoughts...',
  trackingLabel: 'Browsing Hours',
  categories: ['General', 'Learning', 'Entertainment'],
};

const NOTE_COLORS = [
  'border-l-purple-500',
  'border-l-cyan-500',
  'border-l-pink-500',
  'border-l-amber-500',
  'border-l-emerald-500',
  'border-l-rose-500',
];

// ── Helper functions ─────────────────────────────────────────────
function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getFavicon(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

// ── Component ────────────────────────────────────────────────────
export function PersonalizedDashboard({ profession, history, onNavigate, schedules = [], onAddSchedule, onRemoveSchedule }: PersonalizedDashboardProps) {
  const config = PROFESSION_CONFIGS[profession] || DEFAULT_CONFIG;
  const Icon = config.icon;

  // ── Notes state ──────────────────────────────────────────────
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'suggestions' | 'notes' | 'schedule'>('overview');

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`netglide_notes_${profession || 'general'}`);
    if (savedNotes) {
      try { setNotes(JSON.parse(savedNotes)); } catch { setNotes([]); }
    } else {
      setNotes([]);
    }
  }, [profession]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(`netglide_notes_${profession || 'general'}`, JSON.stringify(notes));
  }, [notes, profession]);

  // ── Browsing analytics ────────────────────────────────────────
  const analytics = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const todayEntries = history.filter(h => h.visitedAt >= oneDayAgo);
    const weekEntries = history.filter(h => h.visitedAt >= sevenDaysAgo);

    // Site frequency map (all time)
    const siteFrequency: Record<string, { count: number; lastVisited: number; title: string }> = {};
    history.forEach(item => {
      const hostname = getHostname(item.url);
      if (!siteFrequency[hostname]) {
        siteFrequency[hostname] = { count: 0, lastVisited: 0, title: item.title };
      }
      siteFrequency[hostname].count++;
      if (item.visitedAt > siteFrequency[hostname].lastVisited) {
        siteFrequency[hostname].lastVisited = item.visitedAt;
        siteFrequency[hostname].title = item.title || hostname;
      }
    });

    // Top sites sorted by visit count
    const topSites = Object.entries(siteFrequency)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 8)
      .map(([hostname, data]) => ({ hostname, ...data }));

    // Recent sites (last 24h, unique)
    const recentSitesMap = new Map<string, HistoryItem>();
    todayEntries.forEach(item => {
      const hostname = getHostname(item.url);
      if (!recentSitesMap.has(hostname) || item.visitedAt > (recentSitesMap.get(hostname)?.visitedAt || 0)) {
        recentSitesMap.set(hostname, item);
      }
    });
    const recentSites = Array.from(recentSitesMap.values()).slice(0, 6);

    // Estimated time: each page visit ~3 minutes average
    const estimatedMinutesToday = todayEntries.length * 3;
    const estimatedMinutesWeek = weekEntries.length * 3;
    const estimatedMinutesTotal = history.length * 3;

    // Daily breakdown for last 7 days
    const dailyBreakdown: { day: string; minutes: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayEntries = history.filter(h => h.visitedAt >= dayStart.getTime() && h.visitedAt <= dayEnd.getTime());
      dailyBreakdown.push({
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: dayEntries.length * 3,
        count: dayEntries.length,
      });
    }

    return {
      topSites,
      recentSites,
      estimatedMinutesToday,
      estimatedMinutesWeek,
      estimatedMinutesTotal,
      totalVisitsToday: todayEntries.length,
      totalVisitsWeek: weekEntries.length,
      totalVisitsAll: history.length,
      uniqueSitesToday: recentSitesMap.size,
      dailyBreakdown,
    };
  }, [history]);

  // ── Add note ──────────────────────────────────────────────────
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note: DashboardNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      createdAt: Date.now(),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    };
    setNotes(prev => [note, ...prev]);
    setNewNoteText('');
    setShowAddNote(false);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // ── Filter suggestions not yet visited ────────────────────────
  const visitedHostnames = useMemo(() => new Set(history.map(h => getHostname(h.url))), [history]);
  const filteredSuggestions = config.suggestedSites.filter(
    s => !visitedHostnames.has(getHostname(s.url))
  );
  const visitedSuggestions = config.suggestedSites.filter(
    s => visitedHostnames.has(getHostname(s.url))
  );

  // Chart max value
  const chartMax = Math.max(...analytics.dailyBreakdown.map(d => d.minutes), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-8"
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className={`relative p-6 rounded-3xl bg-gradient-to-br ${config.bgGlow} border border-white/[0.06] backdrop-blur-sm mb-6 overflow-hidden`}>
        {/* Background glow */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br ${config.gradient} opacity-[0.07] blur-3xl`} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {config.label} Dashboard
                <Sparkles className={`w-4 h-4 ${config.accentColor}`} />
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Your personalized browsing insights</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 gap-1">
            {(['overview', 'suggestions', 'notes', 'schedule'] as const).map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  activeSection === section
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════
            OVERVIEW TAB
            ═══════════════════════════════════════════════════════ */}
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  icon: Timer,
                  label: `Today's ${config.trackingLabel}`,
                  value: formatDuration(analytics.estimatedMinutesToday),
                  sub: `${analytics.totalVisitsToday} page visits`,
                  color: 'from-purple-500/20 to-blue-500/20',
                  iconColor: 'text-purple-400',
                },
                {
                  icon: BarChart3,
                  label: 'This Week',
                  value: formatDuration(analytics.estimatedMinutesWeek),
                  sub: `${analytics.totalVisitsWeek} page visits`,
                  color: 'from-cyan-500/20 to-teal-500/20',
                  iconColor: 'text-cyan-400',
                },
                {
                  icon: Activity,
                  label: 'Total Browser Time',
                  value: formatDuration(analytics.estimatedMinutesTotal),
                  sub: `${analytics.totalVisitsAll} total visits`,
                  color: 'from-pink-500/20 to-rose-500/20',
                  iconColor: 'text-pink-400',
                },
                {
                  icon: Eye,
                  label: 'Active Sites Today',
                  value: String(analytics.uniqueSitesToday),
                  sub: 'unique websites',
                  color: 'from-amber-500/20 to-orange-500/20',
                  iconColor: 'text-amber-400',
                },
              ].map((stat, idx) => {
                const SIcon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} border border-white/[0.06] backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <SIcon className={`w-4 h-4 ${stat.iconColor}`} />
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{stat.sub}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Weekly Activity Chart */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <BarChart3 className={`w-4 h-4 ${config.accentColor}`} />
                Weekly Activity
              </h4>
              <div className="flex items-end gap-2 h-32 px-2">
                {analytics.dailyBreakdown.map((day, idx) => {
                  const height = chartMax > 0 ? (day.minutes / chartMax) * 100 : 0;
                  const isToday = idx === analytics.dailyBreakdown.length - 1;
                  return (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-mono">{formatDuration(day.minutes)}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ delay: idx * 0.05, duration: 0.5, ease: 'easeOut' }}
                        className={`w-full rounded-t-lg min-h-[4px] relative group cursor-default ${
                          isToday
                            ? `bg-gradient-to-t ${config.gradient} shadow-lg`
                            : 'bg-white/10 hover:bg-white/20'
                        } transition-colors`}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-gray-800 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                          {day.count} visits
                        </div>
                      </motion.div>
                      <span className={`text-[10px] font-medium ${isToday ? config.accentColor : 'text-gray-500'}`}>{day.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Websites */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <Globe className={`w-4 h-4 ${config.accentColor}`} />
                Most Active Websites
              </h4>
              {analytics.topSites.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No browsing activity yet</p>
                  <p className="text-xs text-gray-600 mt-1">Start browsing to see your activity here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.topSites.map((site, idx) => {
                    const maxCount = analytics.topSites[0]?.count || 1;
                    const barWidth = (site.count / maxCount) * 100;
                    return (
                      <motion.div
                        key={site.hostname}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => onNavigate(`https://${site.hostname}`)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer group"
                      >
                        <span className="text-xs font-mono text-gray-600 w-5 text-right">{idx + 1}</span>
                        <img
                          src={getFavicon(site.hostname)}
                          alt=""
                          className="w-5 h-5 rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">{site.hostname}</p>
                            <span className="text-[10px] text-gray-500 shrink-0 ml-2">{site.count} visits · ~{formatDuration(site.count * 3)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ delay: idx * 0.04 + 0.2, duration: 0.5 }}
                              className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                            />
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity Today */}
            {analytics.recentSites.length > 0 && (
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${config.accentColor}`} />
                  Recently Active Today
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {analytics.recentSites.map((item, idx) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => onNavigate(item.url)}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.15] transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <img src={getFavicon(getHostname(item.url))} alt="" className="w-4 h-4 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-xs text-gray-300 truncate group-hover:text-white transition-colors">{getHostname(item.url)}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {new Date(item.visitedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            SUGGESTIONS TAB
            ═══════════════════════════════════════════════════════ */}
        {activeSection === 'suggestions' && (
          <motion.div
            key="suggestions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Recommended for You */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                <Target className={`w-4 h-4 ${config.accentColor}`} />
                Recommended for {config.label}s
              </h4>
              <p className="text-[10px] text-gray-500 mb-4">Curated websites to boost your {config.trackingLabel.toLowerCase()}</p>

              {filteredSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredSuggestions.map((site, idx) => (
                    <motion.button
                      key={site.url}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => onNavigate(site.url)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.15] transition-all text-left group"
                    >
                      <img src={getFavicon(getHostname(site.url))} alt="" className="w-5 h-5 rounded shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors font-medium">{site.name}</p>
                        <p className="text-[10px] text-gray-500 truncate">{site.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 group-hover:text-gray-400 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Star className={`w-8 h-8 mx-auto mb-2 ${config.accentColor} opacity-50`} />
                  <p className="text-sm text-gray-500">You've visited all recommended sites!</p>
                  <p className="text-[10px] text-gray-600 mt-1">Keep exploring to discover more</p>
                </div>
              )}
            </div>

            {/* Already Visited Suggestions */}
            {visitedSuggestions.length > 0 && (
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <Star className={`w-4 h-4 ${config.accentColor}`} />
                  Already Explored
                </h4>
                <div className="flex flex-wrap gap-2">
                  {visitedSuggestions.map(site => (
                    <button
                      key={site.url}
                      onClick={() => onNavigate(site.url)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-xs text-gray-400 hover:text-white"
                    >
                      <img src={getFavicon(getHostname(site.url))} alt="" className="w-3.5 h-3.5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      {site.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            NOTES TAB
            ═══════════════════════════════════════════════════════ */}
        {activeSection === 'notes' && (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Add Note */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <StickyNote className={`w-4 h-4 ${config.accentColor}`} />
                  {config.label} Notes
                </h4>
                <button
                  onClick={() => setShowAddNote(!showAddNote)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    showAddNote
                      ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                      : `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                  }`}
                >
                  {showAddNote ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {showAddNote ? 'Cancel' : 'Add Note'}
                </button>
              </div>

              <AnimatePresence>
                {showAddNote && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder={config.notePrompt}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleAddNote();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-600">Press Ctrl+Enter to save</span>
                        <button
                          onClick={handleAddNote}
                          disabled={!newNoteText.trim()}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            newNoteText.trim()
                              ? `bg-gradient-to-r ${config.gradient} text-white shadow-md hover:shadow-lg`
                              : 'bg-white/5 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes List */}
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <StickyNote className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No notes yet</p>
                  <p className="text-xs text-gray-600 mt-1">{config.notePrompt}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {notes.map((note, idx) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] border-l-4 ${note.color} group hover:bg-white/[0.05] transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-gray-300 flex-1 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-600 mt-2">
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════
            SCHEDULE TAB
            ═══════════════════════════════════════════════════════ */}
        {activeSection === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <ScheduleTabContent 
              config={config} 
              schedules={schedules} 
              onAdd={onAddSchedule} 
              onRemove={onRemoveSchedule} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScheduleTabContent({ config, schedules, onAdd, onRemove }: { config: ProfessionConfig, schedules: any[], onAdd?: (item: any) => void, onRemove?: (id: string) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', time: '' });

  const handleAdd = () => {
    if (!newEvent.title || !newEvent.time) return;
    onAdd?.(newEvent);
    setNewEvent({ title: '', description: '', time: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${config.accentColor}`} />
          Daily Schedule
        </h4>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            showAdd ? 'bg-red-500/15 text-red-300' : `bg-gradient-to-r ${config.gradient} text-white`
          }`}
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAdd ? 'Cancel' : 'New Event'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase ml-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Task Name..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase ml-1">Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase ml-1">Action / Note</label>
              <input
                type="text"
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="What to do..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newEvent.title || !newEvent.time}
              className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${config.gradient} text-white text-sm font-bold shadow-lg disabled:opacity-30`}
            >
              Add to Schedule
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {schedules.length === 0 ? (
          <div className="p-8 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
            <p className="text-sm text-gray-500 font-medium">No events scheduled for today</p>
          </div>
        ) : (
          schedules
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] group hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex flex-col items-center justify-center py-1 px-3 rounded-xl bg-white/5 border border-white/5 min-w-[64px]">
                  <span className="text-sm font-bold text-white font-mono">{item.time}</span>
                  <span className="text-[9px] text-gray-500 uppercase font-black">Today</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-semibold text-gray-200 truncate">{item.title}</h5>
                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                </div>
                {item.notified && (
                   <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                     <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Notified</span>
                   </div>
                )}
                <button
                  onClick={() => onRemove?.(item.id)}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
        )}
      </div>
    </div>
  );
}
