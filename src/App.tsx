import { useState, useEffect, useCallback, useRef, useMemo, type MutableRefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Bookmark,
  Settings,
  Layers,
  History,
  Clock,
  ArrowLeft,
  ArrowRight,
  Home as HomeIcon,
  Sun,
  Moon,
  User,
  RefreshCw,
  Timer,
  X,
  Trash2,
  ExternalLink,
  Calendar,
  Shield,
  HelpCircle,
  LogOut,
  UserCircle2,
  Bell,
  Download,
} from 'lucide-react';
import { ParticleBackground } from './components/ParticleBackground';
import { ProfessionPrompt } from './components/ProfessionPrompt';
import { AIAssistant } from './components/AIAssistant';
import { BrowserTab } from './components/BrowserTab';
import { BrowserWebview } from './components/BrowserWebview';
import { QuickLinks } from './components/QuickLinks';
import { BookmarksPanel } from './components/BookmarksPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { WorkspacePanel } from './components/WorkspacePanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ProfileDropdown } from './components/ProfileDropdown';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { getTheme, applyTheme } from './components/utils/themes';
import { PersonalizedDashboard } from './components/PersonalizedDashboard';
import logo from './assets/logo.png';

interface Tab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
  history: string[];
  historyIndex: number;
}

interface Workspace {
  id: string;
  name: string;
  tabs: Tab[];
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
}



interface AppSettings {
  searchEngine: string;
  homepage: string;
  customHomepage: string;
  blockTrackers: boolean;
  blockAds: boolean;
  clearCacheOnExit: boolean;
  clearCookiesOnExit: boolean;
  clearHistoryOnExit: boolean;
  httpsOnly: boolean;
  doNotTrack: boolean;
  fingerprintProtection: boolean;
  safeBrowsing: boolean;
  cookiePolicy: string;
  fontSize: number;
  notifications: boolean;
  vpnEnabled: boolean;
  theme: string;
  isDarkMode: boolean;
  geminiApiKey: string;
  userName: string;
  avatarUrl: string;
  uiDensity: string;
  animationSpeed: string;
  showParticles: boolean;
  tabCloseAction: string;
  maxTabsPerRow: number;
  fontFamily: string;
  timeSectionTheme: string;
}

export interface DownloadItem {
  id: string;
  name: string;
  progress: number;
  speed: string;
  totalSize: string;
  status: 'downloading' | 'completed' | 'failed';
  icon: string;
  startTime: number;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  time: string; // HH:mm
  notified: boolean;
  read: boolean;
  createdAt: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  searchEngine: 'google',
  homepage: 'default',
  customHomepage: '',
  blockTrackers: true,
  blockAds: false,
  clearCacheOnExit: false,
  clearCookiesOnExit: false,
  clearHistoryOnExit: false,
  httpsOnly: true,
  doNotTrack: true,
  fingerprintProtection: false,
  safeBrowsing: true,
  cookiePolicy: 'allow-all',
  fontSize: 16,
  notifications: true,
  vpnEnabled: false,
  theme: 'gx-neon',
  isDarkMode: true,
  geminiApiKey: '',
  userName: 'Explorer',
  avatarUrl: '',
  uiDensity: 'comfortable',
  animationSpeed: 'normal',
  showParticles: true,
  tabCloseAction: 'previous',
  maxTabsPerRow: 6,
  fontFamily: 'Inter',
  timeSectionTheme: 'modern-glow',
};

// ── Google Autocomplete via JSONP ─────────────────────────────
function fetchGoogleSuggestions(query: string): Promise<string[]> {
  return new Promise((resolve) => {
    if (!query.trim()) { resolve([]); return; }
    const cbName = `__gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const timeout = setTimeout(() => {
      cleanup();
      resolve([]);
    }, 3000);

    const cleanup = () => {
      clearTimeout(timeout);
      delete (window as any)[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
    };

    (window as any)[cbName] = (data: any) => {
      cleanup();
      try {
        // Google returns [query, [suggestions...]]
        resolve(Array.isArray(data[1]) ? data[1].slice(0, 6) : []);
      } catch { resolve([]); }
    };

    const script = document.createElement('script');
    script.id = cbName;
    script.src = `https://suggestqueries.google.com/complete/search?client=youtube&q=${encodeURIComponent(query)}&callback=${cbName}`;
    script.onerror = () => { cleanup(); resolve([]); };
    document.head.appendChild(script);
  });
}

function App() {
  const [showProfessionPrompt, setShowProfessionPrompt] = useState(false);
  const [profession, setProfession] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: '1',
      name: 'Main Workspace',
      tabs: [{ id: '1', url: '', title: 'New Tab', isActive: true, history: [], historyIndex: -1 }],
    },
  ]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState('1');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [customLinks, setCustomLinks] = useState<import('./components/QuickLinks').QuickLink[]>([]);
  const [hiddenLinkIds, setHiddenLinkIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWorkspaces, setShowWorkspaces] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showDashboardPopup, setShowDashboardPopup] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const [showDownloads, setShowDownloads] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<{ id: string; title: string, description: string, time: string }[]>([]);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Google suggestions + recent search history state
  const [googleSuggestions, setGoogleSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const googleDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [timeTracking, setTimeTracking] = useState<Record<string, number>>({});
  const [totalTimeToday, setTotalTimeToday] = useState(0);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];
  const activeTab = currentWorkspace.tabs.find((t) => t.isActive);

  // ── Load recent searches from localStorage ────────────────
  useEffect(() => {
    const saved = localStorage.getItem('netglide_recent_searches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      const cleaned = query.trim();
      if (!cleaned) return prev;
      const deduped = prev.filter(s => s.toLowerCase() !== cleaned.toLowerCase());
      const updated = [cleaned, ...deduped].slice(0, 15);
      localStorage.setItem('netglide_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeRecentSearch = useCallback((query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== query);
      localStorage.setItem('netglide_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('netglide_recent_searches');
  }, []);

  // ── Fetch Google suggestions on query change (debounced) ───
  useEffect(() => {
    if (googleDebounceRef.current) clearTimeout(googleDebounceRef.current);
    const q = searchQuery.trim();
    if (!q) { setGoogleSuggestions([]); return; }

    googleDebounceRef.current = setTimeout(() => {
      fetchGoogleSuggestions(q).then(setGoogleSuggestions);
    }, 250);

    return () => { if (googleDebounceRef.current) clearTimeout(googleDebounceRef.current); };
  }, [searchQuery]);

  // ── Search Suggestions (from history + bookmarks) ──────────
  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const results: { type: string; title: string; url: string }[] = [];
    const seenUrls = new Set<string>();

    // Bookmarks first (higher priority)
    bookmarks.forEach(bm => {
      if (results.length >= 5) return;
      if (bm.title.toLowerCase().includes(query) || bm.url.toLowerCase().includes(query)) {
        if (!seenUrls.has(bm.url)) {
          seenUrls.add(bm.url);
          results.push({ type: 'bookmark', title: bm.title, url: bm.url });
        }
      }
    });

    // Then history (recent first)
    [...history].reverse().forEach(item => {
      if (results.length >= 8) return;
      if (item.title.toLowerCase().includes(query) || item.url.toLowerCase().includes(query)) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          results.push({ type: 'history', title: item.title, url: item.url });
        }
      }
    });

    return results;
  }, [searchQuery, history, bookmarks]);

  // ── Filtered recent-searches for dropdown ─────────────────
  const filteredRecentSearches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentSearches.slice(0, 5);
    return recentSearches.filter(s => s.toLowerCase().includes(q)).slice(0, 5);
  }, [searchQuery, recentSearches]);

  // ── Merged suggestion list for keyboard navigation ────────
  const triggeredSchedules = useMemo(() => {
    return schedules.filter(s => s.notified);
  }, [schedules]);
  
  const allSuggestions = useMemo(() => {
    const items: { kind: 'recent' | 'google' | 'bookmark' | 'history' | 'search'; label: string; url?: string }[] = [];
    const seen = new Set<string>();

    // Recent searches first
    filteredRecentSearches.forEach(s => {
      if (!seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        items.push({ kind: 'recent', label: s });
      }
    });

    // Google suggestions
    googleSuggestions.forEach(s => {
      if (!seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase());
        items.push({ kind: 'google', label: s });
      }
    });

    // Bookmark / history matches
    searchSuggestions.forEach(s => {
      items.push({ kind: s.type as 'bookmark' | 'history', label: s.title, url: s.url });
    });

    // "Search for..." fallback at the end
    if (searchQuery.trim()) {
      items.push({ kind: 'search', label: searchQuery.trim() });
    }

    return items;
  }, [filteredRecentSearches, googleSuggestions, searchSuggestions, searchQuery]);

  useEffect(() => {
    const savedProfession = localStorage.getItem('cozytab_profession');
    const savedWorkspaces = localStorage.getItem('cozytab_workspaces');
    const savedBookmarks = localStorage.getItem('cozytab_bookmarks');
    const savedHistory = localStorage.getItem('cozytab_history');
    const savedSettings = localStorage.getItem('cozytab_settings');
    const savedCustomLinks = localStorage.getItem('cozytab_custom_links');
    const savedHiddenLinks = localStorage.getItem('cozytab_hidden_links');
    const savedSchedules = localStorage.getItem('cozytab_schedules');
    const hasSeenPrompt = localStorage.getItem('cozytab_seen_prompt');

    if (savedSettings) {
      const loadedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      setSettings(loadedSettings);
      const theme = getTheme(loadedSettings.theme || 'gx-neon');
      applyTheme(theme);
    } else {
      const defaultTheme = getTheme('gx-neon');
      applyTheme(defaultTheme);
    }

    if (savedProfession) setProfession(savedProfession);
    if (savedWorkspaces) {
      const loadedWorkspaces = JSON.parse(savedWorkspaces);
      const migratedWorkspaces = loadedWorkspaces.map((workspace: Workspace) => ({
        ...workspace,
        tabs: workspace.tabs.map((tab: Tab) => ({
          ...tab,
          history: tab.history || [],
          historyIndex: tab.historyIndex ?? -1,
        })),
      }));
      setWorkspaces(migratedWorkspaces);
    }
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedCustomLinks) setCustomLinks(JSON.parse(savedCustomLinks));
    if (savedHiddenLinks) setHiddenLinkIds(JSON.parse(savedHiddenLinks));
    if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
    if (!hasSeenPrompt) setShowProfessionPrompt(true);
  }, []);

  useEffect(() => { if (profession) localStorage.setItem('cozytab_profession', profession); }, [profession]);
  useEffect(() => { localStorage.setItem('cozytab_workspaces', JSON.stringify(workspaces)); }, [workspaces]);
  useEffect(() => { localStorage.setItem('cozytab_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  useEffect(() => { localStorage.setItem('cozytab_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('cozytab_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('cozytab_custom_links', JSON.stringify(customLinks)); }, [customLinks]);
  useEffect(() => { localStorage.setItem('cozytab_hidden_links', JSON.stringify(hiddenLinkIds)); }, [hiddenLinkIds]);
  useEffect(() => { localStorage.setItem('cozytab_schedules', JSON.stringify(schedules)); }, [schedules]);

  // ── Notification Check Timer ───────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      setSchedules(prev => {
        let changed = false;
        const newSchedules = prev.map(item => {
          const [h, m] = item.time.split(':').map(Number);
          const taskTimeInMinutes = h * 60 + m;
          
          // Check if it's exactly 5 minutes before the task and we haven't notified
          if (!item.notified && taskTimeInMinutes - currentTimeInMinutes <= 5 && taskTimeInMinutes - currentTimeInMinutes > 0) {
            setActiveNotifications(an => [
              ...an, 
              { id: item.id, title: item.title, description: item.description, time: item.time }
            ]);
            changed = true;
            return { ...item, notified: true };
          }
          return item;
        });
        return changed ? newSchedules : prev;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(timer);
  }, []);

  const handleAddSchedule = useCallback((item: Omit<ScheduleItem, 'id' | 'notified' | 'read' | 'createdAt'>) => {
    const newItem: ScheduleItem = {
      ...item,
      id: Date.now().toString(),
      notified: false,
      read: false,
      createdAt: Date.now(),
    };
    setSchedules(prev => [newItem, ...prev]);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setSchedules(prev => prev.map(s => s.notified ? { ...s, read: true } : s));
  }, []);

  const handleRemoveSchedule = useCallback((id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  // ── Time Tracking ────────────────────────────────────────────
  useEffect(() => {
    // Load today's tracking data
    const todayKey = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem(`netglide_time_${todayKey}`);
    if (saved) {
      try { setTimeTracking(JSON.parse(saved)); } catch { setTimeTracking({}); }
    }

    // Track time on the active tab every second
    const interval = setInterval(() => {
      const currentTodayKey = new Date().toISOString().slice(0, 10);
      setTimeTracking(prev => {
        // Get current active tab URL
        const ws = workspaces.find(w => w.id === currentWorkspaceId);
        const tab = ws?.tabs.find(t => t.isActive);
        let domain = 'newtab';
        if (tab?.url) {
          try { domain = new URL(tab.url).hostname.replace('www.', ''); } catch { domain = 'unknown'; }
        }
        const updated = { ...prev, [domain]: (prev[domain] || 0) + 1 };
        localStorage.setItem(`netglide_time_${currentTodayKey}`, JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [workspaces, currentWorkspaceId]);

  // Compute total time whenever tracking data changes
  useEffect(() => {
    const total = Object.values(timeTracking).reduce((a, b) => a + b, 0);
    setTotalTimeToday(total);
  }, [timeTracking]);

  const formatTimeSpent = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatSiteTime = (totalSeconds: number): string => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${totalSeconds % 60}s`;
    return `${totalSeconds}s`;
  };

  // Apply font size, density, font family, animation speed to the document
  useEffect(() => {
    const root = document.documentElement;
    // fontSize is now a number (px)
    const fs = typeof settings.fontSize === 'number' ? settings.fontSize : 16;
    root.style.setProperty('--font-size', `${fs}px`);

    const densityMap: Record<string, string> = { compact: '0.65', comfortable: '1', spacious: '1.35' };
    root.style.setProperty('--ui-density', densityMap[settings.uiDensity] || '1');

    const fontMap: Record<string, string> = {
      'Inter': "'Inter', system-ui, sans-serif",
      'Roboto': "'Roboto', system-ui, sans-serif",
      'JetBrains Mono': "'JetBrains Mono', monospace",
      'Outfit': "'Outfit', system-ui, sans-serif",
      'Space Grotesk': "'Space Grotesk', system-ui, sans-serif",
      'System': 'system-ui, -apple-system, sans-serif',
    };
    root.style.setProperty('--font-family', fontMap[settings.fontFamily] || fontMap['Inter']);
    document.body.style.fontFamily = fontMap[settings.fontFamily] || fontMap['Inter'];

    const speedMap: Record<string, string> = { off: '0s', slow: '0.6s', normal: '0.3s', fast: '0.15s' };
    root.style.setProperty('--animation-speed', speedMap[settings.animationSpeed] || '0.3s');
  }, [settings.fontSize, settings.uiDensity, settings.fontFamily, settings.animationSpeed]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleProfessionSelect = (selectedProfession: string) => {
    setProfession(selectedProfession);
    setShowProfessionPrompt(false);
    localStorage.setItem('cozytab_seen_prompt', 'true');
  };

  const handleNavigate = (url: string) => {
    if (!url) return;
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }

    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              const newHistory = tab.history.slice(0, tab.historyIndex + 1);
              newHistory.push(finalUrl);
              return { ...tab, url: finalUrl, title: 'Loading...', history: newHistory, historyIndex: newHistory.length - 1 };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });

    setWorkspaces(updatedWorkspaces);
    try {
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        url: finalUrl,
        title: new URL(finalUrl).hostname,
        visitedAt: Date.now(),
      };
      setHistory((prev) => [...prev, historyItem]);
    } catch (e) {
      console.error('Error adding to history:', e);
    }
  };

  // ── Execute a search query (used by handleSearch + suggestion clicks) ──
  const executeSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    addRecentSearch(query);
    let url = query;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Full URL
    } else if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    } else {
      const engines: Record<string, string> = {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
        brave: 'https://search.brave.com/search?q=',
        yahoo: 'https://search.yahoo.com/search?p=',
        opera: 'https://search.yahoo.com/search?p=',
        ecosia: 'https://www.ecosia.org/search?q=',
        startpage: 'https://www.startpage.com/do/search?q=',
        yandex: 'https://yandex.com/search/?text=',
      };
      url = (engines[settings.searchEngine] || engines.google) + encodeURIComponent(query);
    }
    handleNavigate(url);
  }, [settings.searchEngine, addRecentSearch]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = allSuggestions.length;

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIdx(-1);
      (e.target as HTMLInputElement).blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSuggestions) setShowSuggestions(true);
      setSelectedSuggestionIdx(prev => (prev + 1) % total);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIdx(prev => prev <= 0 ? total - 1 : prev - 1);
      return;
    }

    if (e.key !== 'Enter') return;
    e.preventDefault();
    setShowSuggestions(false);

    // If a suggestion is highlighted, act on it
    if (selectedSuggestionIdx >= 0 && selectedSuggestionIdx < total) {
      const item = allSuggestions[selectedSuggestionIdx];
      if (item.url) {
        // Direct URL (bookmark / history)
        handleNavigate(item.url);
      } else {
        // Text-based (recent / google / fallback search)
        executeSearch(item.label);
      }
      setSearchQuery('');
      setSelectedSuggestionIdx(-1);
      return;
    }

    // Otherwise perform a normal search
    const query = searchQuery.trim();
    if (!query) return;
    executeSearch(query);
    setSearchQuery('');
    setSelectedSuggestionIdx(-1);
  };

  const handleBack = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex <= 0) return;
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive && tab.historyIndex > 0) {
              const newIndex = tab.historyIndex - 1;
              return { ...tab, url: tab.history[newIndex], historyIndex: newIndex };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });
    setWorkspaces(updatedWorkspaces);
  };

  const handleForward = () => {
    if (!activeTab || !activeTab.history || activeTab.historyIndex >= activeTab.history.length - 1) return;
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive && tab.historyIndex < tab.history.length - 1) {
              const newIndex = tab.historyIndex + 1;
              return { ...tab, url: tab.history[newIndex], historyIndex: newIndex };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });
    setWorkspaces(updatedWorkspaces);
  };

  // ── Resolve homepage setting to a URL ───────────────────────
  const getHomepageUrl = useCallback((): { url: string; title: string } => {
    const hp = settings.homepage || 'default';
    const presetUrls: Record<string, { url: string; title: string }> = {
      'default': { url: '', title: 'New Tab' },
      'google-home': { url: 'https://www.google.com', title: 'Google' },
      'bing-home': { url: 'https://www.bing.com', title: 'Bing' },
      'duckduckgo-home': { url: 'https://duckduckgo.com', title: 'DuckDuckGo' },
      'brave-home': { url: 'https://search.brave.com', title: 'Brave Search' },
      'reddit-home': { url: 'https://www.reddit.com', title: 'Reddit' },
      'youtube-home': { url: 'https://www.youtube.com', title: 'YouTube' },
    };
    if (presetUrls[hp]) return presetUrls[hp];
    if (hp === 'custom' && settings.customHomepage?.trim()) {
      let customUrl = settings.customHomepage.trim();
      if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
        customUrl = 'https://' + customUrl;
      }
      try {
        return { url: customUrl, title: new URL(customUrl).hostname };
      } catch {
        return { url: customUrl, title: 'Home' };
      }
    }
    return { url: '', title: 'New Tab' };
  }, [settings.homepage, settings.customHomepage]);

  const handleHome = () => {
    const homepage = getHomepageUrl();
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return {
          ...workspace,
          tabs: workspace.tabs.map((tab) => {
            if (tab.isActive) {
              if (homepage.url && homepage.url !== 'about:blank') {
                return { ...tab, url: homepage.url, title: homepage.title, history: [homepage.url], historyIndex: 0 };
              }
              return { ...tab, url: '', title: 'New Tab', history: [], historyIndex: -1 };
            }
            return tab;
          }),
        };
      }
      return workspace;
    });
    setWorkspaces(updatedWorkspaces);
  };

  const handleNewTab = () => {
    const homepage = getHomepageUrl();
    const hasHomepage = homepage.url && homepage.url !== 'about:blank';
    const newTab: Tab = {
      id: Date.now().toString(),
      url: hasHomepage ? homepage.url : '',
      title: hasHomepage ? homepage.title : 'New Tab',
      isActive: true,
      history: hasHomepage ? [homepage.url] : [],
      historyIndex: hasHomepage ? 0 : -1,
    };
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return { ...workspace, tabs: [...workspace.tabs.map((t) => ({ ...t, isActive: false })), newTab] };
      }
      return workspace;
    });
    setWorkspaces(updatedWorkspaces);
  };

  const handleCloseTab = (tabId: string) => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        const filteredTabs = workspace.tabs.filter((t) => t.id !== tabId);
        if (filteredTabs.length === 0) {
          const homepage = getHomepageUrl();
          const hasHomepage = homepage.url && homepage.url !== 'about:blank';
          return { ...workspace, tabs: [{
            id: Date.now().toString(),
            url: hasHomepage ? homepage.url : '',
            title: hasHomepage ? homepage.title : 'New Tab',
            isActive: true,
            history: hasHomepage ? [homepage.url] : [],
            historyIndex: hasHomepage ? 0 : -1,
          }] };
        }
        const closedTabWasActive = workspace.tabs.find((t) => t.id === tabId)?.isActive;
        if (closedTabWasActive && filteredTabs.length > 0) {
          filteredTabs[filteredTabs.length - 1].isActive = true;
        }
        return { ...workspace, tabs: filteredTabs };
      }
      return workspace;
    });
    setWorkspaces(updatedWorkspaces);
  };

  const handleTabClick = (tabId: string) => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return { ...workspace, tabs: workspace.tabs.map((t) => ({ ...t, isActive: t.id === tabId })) };
      }
      return workspace;
    });
    setWorkspaces(updatedWorkspaces);
  };


  const handleTabTitleChange = (tabId: string, title: string) => {
    const updatedWorkspaces = workspaces.map((workspace) => {
      if (workspace.id === currentWorkspaceId) {
        return { ...workspace, tabs: workspace.tabs.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)) };
      }
      return workspace;
    });
    setWorkspaces(updatedWorkspaces);
  };

  const handleCreateWorkspace = (name: string) => {
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name,
      tabs: [{ id: Date.now().toString(), url: '', title: 'New Tab', isActive: true, history: [], historyIndex: -1 }],
    };
    setWorkspaces([...workspaces, newWorkspace]);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (workspaces.length <= 1) return;
    const filtered = workspaces.filter((w) => w.id !== id);
    setWorkspaces(filtered);
    if (currentWorkspaceId === id) setCurrentWorkspaceId(filtered[0].id);
  };

  const handleAddBookmark = (title: string, url: string) => {
    const bookmark: Bookmark = { id: Date.now().toString(), title, url, createdAt: Date.now() };
    setBookmarks([...bookmarks, bookmark]);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTab) handleCloseTab(activeTab.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        document.getElementById('search-bar')?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setShowWorkspaces(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, workspaces, currentWorkspaceId]);

  const showHomePage = !activeTab?.url;
  const handleCloseSettings = useCallback(() => setShowSettings(false), []);

  return (
    <div className="h-screen w-full overflow-hidden text-white relative">
      {settings.showParticles !== false && <ParticleBackground themeId={settings.theme} />}
      {showProfessionPrompt && <ProfessionPrompt onSelect={handleProfessionSelect} />}

      <div className="relative z-10 w-full h-full flex flex-col overflow-hidden">
        {/* Glass Top Header */}
        <div className="w-full shrink-0 flex flex-col bg-black/60 backdrop-blur-3xl border-b border-white/10 z-50">
          
          {/* Tier 1: Browser Tabs */}
          <div 
            className="w-full flex items-center h-11 px-2 mt-1 gap-1"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: currentWorkspace.tabs.length > 8 
                ? `repeat(${currentWorkspace.tabs.length}, minmax(40px, 1fr)) 40px` 
                : 'repeat(auto-fill, minmax(140px, 1fr)) 40px' 
            }}
          >
            <AnimatePresence>
              {currentWorkspace.tabs.map((tab) => (
                <BrowserTab 
                  key={tab.id} 
                  tab={tab} 
                  onClose={handleCloseTab} 
                  onClick={handleTabClick}
                  isCompact={currentWorkspace.tabs.length > 8}
                />
              ))}
            </AnimatePresence>
            <Button onClick={handleNewTab} variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white hover:bg-white/10 shrink-0 ml-1">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Tier 2: Navigation & Actions */}
          <div className="w-full h-14 px-4 flex items-center gap-4">
            
            {/* Nav Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={handleBack} disabled={!activeTab || !activeTab.history || activeTab.historyIndex <= 0} className={`p-2 rounded-lg transition-colors ${!activeTab || !activeTab.history || activeTab.historyIndex <= 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={handleForward} disabled={!activeTab || !activeTab.history || activeTab.historyIndex >= (activeTab.history?.length || 0) - 1} className={`p-2 rounded-lg transition-colors ${!activeTab || !activeTab.history || activeTab.historyIndex >= (activeTab.history?.length || 0) - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => {
                if (activeTab?.url) {
                  // Reload current page by re-navigating to same URL
                  const url = activeTab.url;
                  handleHome();
                  setTimeout(() => handleNavigate(url), 50);
                } else {
                  // On home page, just reload the app
                  window.location.reload();
                }
              }} className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={handleHome} className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                <HomeIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Omnibox / Search */}
            <div className="flex-1 max-w-4xl mx-auto relative" ref={searchBarRef}>
              <div className="flex items-center h-10 bg-black/40 border border-white/10 rounded-full overflow-hidden px-4 group hover:border-white/30 focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all shadow-inner">
                <Search className="w-4 h-4 text-gray-400 shrink-0 group-focus-within:text-purple-400 transition-colors" />
                <Input
                  id="search-bar"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setSelectedSuggestionIdx(-1);
                  }}
                  onKeyDown={handleSearch}
                  onFocus={(e) => {
                    setShowSuggestions(true);
                    if (activeTab?.url && !searchQuery) {
                      setSearchQuery(activeTab.url);
                    }
                    e.currentTarget.select();
                  }}
                  onBlur={() => { 
                    setTimeout(() => setShowSuggestions(false), 200); 
                  }}
                  placeholder={activeTab?.url ? activeTab.url : "Search or enter URL..."}
                  className="flex-1 border-0 bg-transparent text-white placeholder:text-gray-500 shadow-none focus-visible:ring-0 h-full text-sm font-medium px-3 leading-loose"
                  autoComplete="off"
                />
              </div>

              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && (searchQuery.trim() || recentSearches.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 z-[100] mt-1.5 bg-gray-900/[0.98] backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
                  >
                    <div className="py-1.5 max-h-96 overflow-y-auto custom-scrollbar">

                      {/* ── When empty: show recent searches header ─── */}
                      {!searchQuery.trim() && recentSearches.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Recent Searches</span>
                          <button
                            onMouseDown={(e) => { e.preventDefault(); clearAllRecentSearches(); }}
                            className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                          >
                            Clear all
                          </button>
                        </div>
                      )}

                      {/* ── When empty: show recent search items ───── */}
                      {!searchQuery.trim() && recentSearches.slice(0, 8).map((query, idx) => (
                        <button
                          key={`empty-recent-${idx}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(query);
                            executeSearch(query);
                            setSearchQuery('');
                            setShowSuggestions(false);
                          }}
                          onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group ${
                            selectedSuggestionIdx === idx
                              ? 'bg-purple-500/15 text-white'
                              : 'text-gray-300 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="p-1.5 rounded-lg shrink-0 bg-teal-500/15 text-teal-400">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                          <p className="flex-1 text-sm truncate">{query}</p>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeRecentSearch(query);
                            }}
                            className="p-1 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      ))}

                      {/* ── When typing: show merged suggestions ──── */}
                      {searchQuery.trim() && (() => {
                        let globalIdx = 0;
                        const hasRecent = filteredRecentSearches.length > 0;
                        const hasGoogle = googleSuggestions.length > 0;
                        const hasSites = searchSuggestions.length > 0;

                        return (
                          <>
                            {/* Recent search matches */}
                            {hasRecent && (
                              <>
                                <div className="px-4 pt-2 pb-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Recent</span>
                                </div>
                                {filteredRecentSearches.map((s) => {
                                  const idx = globalIdx++;
                                  return (
                                    <button
                                      key={`recent-${s}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeSearch(s);
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                        setSelectedSuggestionIdx(-1);
                                      }}
                                      onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors group ${
                                        selectedSuggestionIdx === idx
                                          ? 'bg-purple-500/15 text-white'
                                          : 'text-gray-300 hover:bg-white/[0.06]'
                                      }`}
                                    >
                                      <div className="p-1.5 rounded-lg shrink-0 bg-teal-500/15 text-teal-400">
                                        <Clock className="w-3.5 h-3.5" />
                                      </div>
                                      <p className="flex-1 text-sm truncate">{s}</p>
                                      <button
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          removeRecentSearch(s);
                                        }}
                                        className="p-1 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                        title="Remove"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </button>
                                  );
                                })}
                              </>
                            )}

                            {/* Google suggestions */}
                            {hasGoogle && (
                              <>
                                {hasRecent && <div className="border-t border-white/[0.06] mx-3 my-1" />}
                                <div className="px-4 pt-2 pb-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Suggestions</span>
                                </div>
                                {googleSuggestions.map((s) => {
                                  const idx = globalIdx++;
                                  return (
                                    <button
                                      key={`google-${s}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        executeSearch(s);
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                        setSelectedSuggestionIdx(-1);
                                      }}
                                      onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                                        selectedSuggestionIdx === idx
                                          ? 'bg-purple-500/15 text-white'
                                          : 'text-gray-300 hover:bg-white/[0.06]'
                                      }`}
                                    >
                                      <div className="p-1.5 rounded-lg shrink-0 bg-blue-500/15 text-blue-400">
                                        <Search className="w-3.5 h-3.5" />
                                      </div>
                                      <p className="flex-1 text-sm truncate">{s}</p>
                                    </button>
                                  );
                                })}
                              </>
                            )}

                            {/* Bookmark / History site matches */}
                            {hasSites && (
                              <>
                                {(hasRecent || hasGoogle) && <div className="border-t border-white/[0.06] mx-3 my-1" />}
                                <div className="px-4 pt-2 pb-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Sites</span>
                                </div>
                                {searchSuggestions.map((suggestion) => {
                                  const idx = globalIdx++;
                                  return (
                                    <button
                                      key={`site-${suggestion.url}-${idx}`}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleNavigate(suggestion.url);
                                        setSearchQuery('');
                                        setShowSuggestions(false);
                                        setSelectedSuggestionIdx(-1);
                                      }}
                                      onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                                        selectedSuggestionIdx === idx
                                          ? 'bg-purple-500/15 text-white'
                                          : 'text-gray-300 hover:bg-white/[0.06]'
                                      }`}
                                    >
                                      <div className={`p-1.5 rounded-lg shrink-0 ${
                                        suggestion.type === 'bookmark'
                                          ? 'bg-amber-500/15 text-amber-400'
                                          : 'bg-purple-500/15 text-purple-400'
                                      }`}>
                                        {suggestion.type === 'bookmark'
                                          ? <Bookmark className="w-3.5 h-3.5" />
                                          : <History className="w-3.5 h-3.5" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate font-medium">{suggestion.title}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{suggestion.url}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </>
                            )}

                            {/* "Search for..." fallback */}
                            {(() => {
                              const idx = globalIdx++;
                              return (
                                <>
                                  {(hasRecent || hasGoogle || hasSites) && <div className="border-t border-white/[0.06] mx-3 my-1" />}
                                  <button
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      executeSearch(searchQuery.trim());
                                      setSearchQuery('');
                                      setShowSuggestions(false);
                                      setSelectedSuggestionIdx(-1);
                                    }}
                                    onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                      selectedSuggestionIdx === idx
                                        ? 'bg-purple-500/15 text-white'
                                        : 'text-gray-300 hover:bg-white/[0.06]'
                                    }`}
                                  >
                                    <div className="p-1.5 rounded-lg shrink-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400">
                                      <Search className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-sm">
                                      Search <span className="text-purple-400 font-medium">"{searchQuery.trim()}"</span>
                                    </p>
                                  </button>
                                </>
                              );
                            })()}
                          </>
                        );
                      })()}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions: History, Bookmarks, Profile, Dashboard | Workspaces, Night Mode, Settings */}
            <div className="flex items-center gap-1 shrink-0">
              <div className="relative">
                <Button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                  }} 
                  variant="ghost" size="icon" 
                  className={`text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-9 h-9 relative ${showNotifications ? 'bg-white/10 text-white' : ''}`} 
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {schedules.some(s => s.notified && !s.read) && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-gray-900" />}
                </Button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">Reminders {schedules.filter(s => s.notified && !s.read).length > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px]">{schedules.filter(s => s.notified && !s.read).length}</span>}</h4>
                        <button onClick={handleMarkAllAsRead} className="text-[10px] text-gray-500 hover:text-white transition-colors">Read all</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                        {triggeredSchedules.length === 0 ? (
                          <div className="py-8 text-center text-gray-500 text-xs text-pretty px-6">
                            You're all caught up! No recent alerts or upcoming tasks.
                          </div>
                        ) : (
                          triggeredSchedules.map(n => (
                            <div key={n.id} className={`p-3 rounded-xl border transition-colors ${!n.read ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/5'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
                                  <span className={`text-[10px] font-bold uppercase tracking-tighter ${!n.read ? 'text-purple-400' : 'text-gray-500'}`}>Event Alert</span>
                                </div>
                                <span className={`text-[10px] font-mono ${!n.read ? 'text-purple-300' : 'text-gray-500'}`}>{n.time}</span>
                              </div>
                              <h5 className={`text-sm font-semibold mt-1 ${!n.read ? 'text-white' : 'text-gray-400'}`}>{n.title}</h5>
                              <p className={`text-xs ${!n.read ? 'text-gray-300' : 'text-gray-500'}`}>{n.description}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <Button 
                  onClick={() => {
                    setShowDownloads(!showDownloads);
                    // Demo: add a download if list is empty
                    if (downloads.length === 0) {
                      const demo: DownloadItem = {
                        id: 'demo-1',
                        name: 'NetGlide_Beta_Update.zip',
                        progress: 0,
                        speed: '2.4 MB/s',
                        totalSize: '245 MB',
                        status: 'downloading',
                        icon: '📦',
                        startTime: Date.now()
                      };
                      setDownloads([demo]);
                      const iv = setInterval(() => {
                        setDownloads(prev => {
                          const item = prev[0];
                          if (!item || item.progress >= 100) {
                            clearInterval(iv);
                            return prev.map(p => p.id === 'demo-1' ? { ...p, status: 'completed', progress: 100 } : p);
                          }
                          return prev.map(p => p.id === 'demo-1' ? { ...p, progress: Math.min(100, item.progress + 1.5), speed: (2.0 + Math.random() * 0.8).toFixed(1) + ' MB/s' } : p);
                        });
                      }, 500);
                    }
                  }} 
                  variant="ghost" size="icon" 
                  className={`text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-9 h-9 relative ${showDownloads ? 'bg-white/10 text-white' : ''}`} 
                  title="Downloads"
                >
                  <Download className="w-4 h-4" />
                  {downloads.some(d => d.status === 'downloading') && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                      <circle
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke="rgba(168, 85, 247, 0.2)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        strokeDasharray={2 * Math.PI * 14}
                        strokeDashoffset={2 * Math.PI * 14 * (1 - (downloads.find(d => d.status === 'downloading')?.progress || 0) / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                  )}
                </Button>

                <AnimatePresence>
                  {showDownloads && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white">Downloads</h4>
                        <button onClick={() => setDownloads([])} className="text-[10px] text-gray-500 hover:text-white transition-colors">Clear all</button>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                        {downloads.length === 0 ? (
                          <div className="py-10 text-center text-gray-500 text-xs">No downloads yet</div>
                        ) : (
                          downloads.map(d => (
                            <div key={d.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-white/5 text-lg">{d.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{d.name}</p>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-[10px] text-gray-500">{d.totalSize}</span>
                                    <span className="text-[10px] font-mono text-purple-400">{d.status === 'downloading' ? d.speed : 'Completed'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden relative">
                                <motion.div 
                                  className={`h-full bg-gradient-to-r from-purple-500 to-blue-500`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${d.progress}%` }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button onClick={() => setShowDashboardPopup(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-9 h-9" title="Dashboard"><Timer className="w-4 h-4" /></Button>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <Button onClick={() => setShowWorkspaces(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-9 h-9" title="Workspaces"><Layers className="w-4 h-4" /></Button>
              <Button onClick={() => setSettings({ ...settings, isDarkMode: !settings.isDarkMode })} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-9 h-9" title="Toggle Web Dark Mode">
                {settings.isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full w-9 h-9" title="Settings"><Settings className="w-4 h-4" /></Button>
            </div>

          </div>
        </div>



        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative w-full h-full">
            {showHomePage ? (
              <div className="h-full overflow-y-auto p-8 pt-6 relative">
                {/* NetGlide Logo Overlay */}
                {showHomePage && !searchQuery.trim() && (
                  <div className="absolute top-6 left-8 z-40 pointer-events-none select-none">
                    <motion.img
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      src={logo}
                      alt="NetGlide"
                      className="h-10 w-auto brightness-110"
                    />
                  </div>
                )}
                
                {/* Floating Action Icons mirrored under Navbar parents - Main Page Only */}
                {showHomePage && !searchQuery.trim() && (
                  <div className="absolute top-0 right-4 z-40 flex items-center gap-1 pt-1">
                    <Button onClick={() => setShowHistory(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/12 rounded-full w-9 h-9 backdrop-blur-md bg-white/5 border border-white/5" title="History"><History className="w-4 h-4" /></Button>
                    <Button onClick={() => setShowBookmarks(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/12 rounded-full w-9 h-9 backdrop-blur-md bg-white/5 border border-white/5" title="Bookmarks"><Bookmark className="w-4 h-4" /></Button>
                    <Button onClick={() => setShowProfileMenu(true)} variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/12 rounded-full w-9 h-9 backdrop-blur-md bg-white/5 border border-white/5" title="Profile"><User className="w-4 h-4" /></Button>
                  </div>
                )}
                <div className="max-w-6xl mx-auto">
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    {settings.timeSectionTheme === 'minimal' && (
                      <h2 className="text-7xl font-light tracking-tighter text-white/90 mb-2">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </h2>
                    )}

                    {settings.timeSectionTheme === 'modern-glow' && (
                      <div className="flex flex-col items-center gap-2 mb-4">
                        <div className="flex items-center justify-center gap-3 relative">
                          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-150" />
                          <h2 className="text-7xl font-black tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent drop-shadow-2xl relative z-10">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </h2>
                        </div>
                      </div>
                    )}

                    {settings.timeSectionTheme === 'futuristic' && (
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <span className="text-6xl font-black text-white">{currentTime.getHours().toString().padStart(2, '0')}</span>
                        </div>
                        <div className="text-4xl font-bold text-gray-500 animate-pulse">:</div>
                        <div className="px-6 py-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                           <span className="text-6xl font-black text-white">{currentTime.getMinutes().toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                    )}

                    {settings.timeSectionTheme === 'cyber-neon' && (
                      <div className="relative group cursor-default inline-block px-8 py-6 rounded-2xl bg-black/60 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)] overflow-hidden">
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                        <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
                        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-purple-500 to-transparent" />
                        <h2 className="text-7xl font-mono text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-purple-400 to-purple-600 tracking-tighter filter drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </h2>
                        <div className="mt-2 flex items-center justify-center gap-2">
                           <div className="h-[2px] w-4 bg-cyan-500" />
                           <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em]">System Active</span>
                           <div className="h-[2px] w-4 bg-cyan-500" />
                        </div>
                      </div>
                    )}

                    <p className="text-2xl text-gray-300 font-medium tracking-tight">{greeting}</p>
                    {profession && <p className="text-sm text-gray-400 mt-2">Personalized for: <span className="text-purple-400 font-semibold capitalize">{profession}</span></p>}
                  </motion.div>

                  <QuickLinks
                    profession={profession}
                    onNavigate={handleNavigate}
                    customLinks={customLinks}
                    onCustomLinksChange={setCustomLinks}
                    hiddenLinkIds={hiddenLinkIds}
                    onHiddenLinkIdsChange={setHiddenLinkIds}
                    maxPerRow={settings.maxTabsPerRow}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full w-full bg-[#111] relative" id="webview-container">
                {currentWorkspace.tabs.map((tab) => (
                  tab.url && (
                    <BrowserWebview
                      key={tab.id}
                      tab={tab}
                      onTitleChange={handleTabTitleChange}
                      isDarkMode={settings.isDarkMode}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>

      <BookmarksPanel isOpen={showBookmarks} onClose={() => setShowBookmarks(false)} bookmarks={bookmarks} onAddBookmark={handleAddBookmark} onDeleteBookmark={handleDeleteBookmark} onNavigate={handleNavigate} />
      <SettingsPanel isOpen={showSettings} onClose={handleCloseSettings} settings={settings} onSettingsChange={setSettings} profession={profession} onProfessionChange={setProfession} />
      <WorkspacePanel isOpen={showWorkspaces} onClose={() => setShowWorkspaces(false)} workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} onCreateWorkspace={handleCreateWorkspace} onSwitchWorkspace={setCurrentWorkspaceId} onDeleteWorkspace={handleDeleteWorkspace} />
      <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} history={history} onNavigate={handleNavigate} onClearHistory={() => setHistory([])} />
      <AIAssistant geminiApiKey={settings.geminiApiKey} />
      <ProfileDropdown 
        isOpen={showProfileMenu} 
        onClose={() => setShowProfileMenu(false)} 
        profession={profession} 
        userName={settings.userName}
        avatarUrl={settings.avatarUrl}
        onOpenSettings={() => setShowSettings(true)} 
      />

      {/* ── Time Tracker Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showTimeTracker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimeTracker(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[75] w-full max-w-md bg-gradient-to-br from-gray-900/[0.98] to-gray-950/[0.98] border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                    <Timer className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Time Spent Today</h3>
                </div>
                <button
                  onClick={() => setShowTimeTracker(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Total */}
              <div className="p-5 border-b border-white/[0.06] bg-white/[0.02]">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total browsing time</p>
                <p className="text-3xl font-bold text-white">{formatTimeSpent(totalTimeToday)}</p>
              </div>

              {/* Per-site list */}
              <div className="p-5 max-h-80 overflow-y-auto">
                {Object.keys(timeTracking).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No browsing data tracked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(timeTracking)
                      .sort(([, a], [, b]) => b - a)
                      .map(([domain, seconds]) => (
                        <div
                          key={domain}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                        >
                          <span className="text-sm text-gray-300 truncate mr-3">{domain}</span>
                          <span className="text-sm font-mono text-gray-400 shrink-0">{formatSiteTime(seconds)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Personal Dashboard Popup ─────────────────────── */}
      <AnimatePresence>
        {showDashboardPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDashboardPopup(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[75] w-full max-w-2xl max-h-[80vh] bg-gradient-to-br from-gray-900/[0.98] to-gray-950/[0.98] border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    <Timer className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Personal Dashboard</h3>
                    <p className="text-xs text-gray-500">Today: {formatTimeSpent(totalTimeToday)} browsing</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDashboardPopup(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                {/* Top sites by time */}
                {Object.keys(timeTracking).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                    {Object.entries(timeTracking)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([domain, seconds]) => (
                        <div key={domain} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                          <p className="text-xs text-gray-400 truncate">{domain}</p>
                          <p className="text-sm font-semibold text-white mt-1">{formatSiteTime(seconds)}</p>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* PersonalizedDashboard Component */}
                <PersonalizedDashboard
                  profession={profession}
                  history={history}
                  onNavigate={(url) => { setShowDashboardPopup(false); handleNavigate(url); }}
                  schedules={schedules}
                  onAddSchedule={handleAddSchedule}
                  onRemoveSchedule={handleRemoveSchedule}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Global Notification Toast */}
      <AnimatePresence>
        {activeNotifications.length > 0 && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[200] w-80 p-5 rounded-3xl bg-gray-900 border border-purple-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Upcoming Task</h4>
                  <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">In 5 Minutes</p>
                </div>
                <button 
                  onClick={() => setActiveNotifications(prev => prev.slice(1))}
                  className="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{activeNotifications[0].title}</span>
                  <span className="text-xs font-mono text-gray-500">{activeNotifications[0].time}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic">"{activeNotifications[0].description}"</p>
              </div>
              
              <button 
                onClick={() => setActiveNotifications(prev => prev.slice(1))}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold shadow-lg shadow-purple-900/20 active:scale-95 transition-transform"
              >
                Dismiss Notification
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;